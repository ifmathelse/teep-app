"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "@/hooks/use-toast"
import { Plus, Edit, Trash2, Package, CalendarIcon } from "lucide-react"
import { DatePicker } from "@/components/ui/date-picker"
import { cn } from "@/lib/utils"

interface Material {
  id: string
  name: string
  quantity: number
  price: number
  purchase_date: string
}

export default function MaterialsPage() {
  const { user } = useAuth()
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null)

  const [formData, setFormData] = useState({
    name: "",
    quantity: "",
    price: "",
    purchase_date: "",
  })

  useEffect(() => {
    if (user) {
      fetchMaterials()
    }
  }, [user])

  const fetchMaterials = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase.from("materials").select("*").eq("user_id", user.id).order("name")

      if (error) throw error
      setMaterials(data || [])
    } catch (error) {
      console.error("Erro ao carregar materiais:", error)
      toast({
        title: "Erro ao carregar materiais",
        description: "Não foi possível carregar a lista de materiais.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      const materialData = {
        name: formData.name,
        quantity: Number.parseInt(formData.quantity),
        price: Number.parseFloat(formData.price),
        purchase_date: formData.purchase_date,
        user_id: user.id,
      }

      if (editingMaterial) {
        const { error } = await supabase.from("materials").update(materialData).eq("id", editingMaterial.id)

        if (error) throw error
        toast({
          title: "Material atualizado!",
          description: "As informações do material foram atualizadas com sucesso.",
        })
      } else {
        const { error } = await supabase.from("materials").insert([materialData])

        if (error) throw error
        toast({
          title: "Material cadastrado!",
          description: "O material foi adicionado com sucesso.",
        })
      }

      setDialogOpen(false)
      setEditingMaterial(null)
      resetForm()
      fetchMaterials()
    } catch (error) {
      console.error("Erro ao salvar material:", error)
      toast({
        title: "Erro ao salvar material",
        description: "Não foi possível salvar as informações do material.",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (material: Material) => {
    setEditingMaterial(material)
    setFormData({
      name: material.name,
      quantity: material.quantity.toString(),
      price: material.price.toString(),
      purchase_date: material.purchase_date,
    })



    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este material?")) return

    try {
      const { error } = await supabase.from("materials").delete().eq("id", id)

      if (error) throw error
      toast({
        title: "Material excluído!",
        description: "O material foi removido com sucesso.",
      })
      fetchMaterials()
    } catch (error) {
      console.error("Erro ao excluir material:", error)
      toast({
        title: "Erro ao excluir material",
        description: "Não foi possível excluir o material.",
        variant: "destructive",
      })
    }
  }



  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR")
  }



  const resetForm = () => {
    setFormData({ name: "", quantity: "", price: "", purchase_date: "" })
    setEditingMaterial(null)
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-green-800 dark:text-green-400">Gestão de Materiais</h1>
        <p className="text-green-600 dark:text-green-500 mt-2">Controle seu inventário de materiais de treinamento</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600">
              <Plus className="w-4 h-4 mr-2" />
              Novo Material
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingMaterial ? "Editar Material" : "Novo Material"}</DialogTitle>
              <DialogDescription>
                {editingMaterial ? "Atualize as informações do material." : "Adicione um novo material ao inventário."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Material</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="Ex: Bolas de Tênis Wilson"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Quantidade</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  required
                  placeholder="Ex: 10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Preço Unitário (R$)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                  placeholder="Ex: 15.90"
                />
              </div>

              <div className="space-y-2">
                <Label>Data de Aquisição</Label>
                <DatePicker
                  value={formData.purchase_date || ''}
                  onChange={(date) => setFormData({ ...formData, purchase_date: date })}
                  placeholder="Selecione a data de compra"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setDialogOpen(false)
                    resetForm()
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit" className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600" disabled={!formData.purchase_date}>
                  {editingMaterial ? "Atualizar" : "Cadastrar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {materials.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Nenhum material cadastrado</h3>
        <p className="text-gray-500 dark:text-gray-400 text-center mb-4">Comece adicionando seus materiais de treinamento.</p>
        <Button onClick={() => setDialogOpen(true)} className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Primeiro Material
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {materials.map((material) => (
            <Card key={material.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">{material.name}</CardTitle>
                <CardDescription>
                  <div className="space-y-1">
                    <p>Quantidade: {material.quantity}</p>
                    <p>Preço unitário: {formatCurrency(material.price)}</p>
                    <p>Total: {formatCurrency(material.price * material.quantity)}</p>
                    <p>Adquirido em: {formatDate(material.purchase_date)}</p>
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(material)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(material.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
