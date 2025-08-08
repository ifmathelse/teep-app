"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { Plus, Search, Edit, Trash2, StickyNote, Calendar, Clock } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface Note {
  id: string
  title: string
  content: string
  category: string
  created_at: string
  updated_at: string
  user_id: string
}

const categories = [
  { value: "geral", label: "Geral", color: "bg-blue-500" },
  { value: "alunos", label: "Alunos", color: "bg-green-500" },
  { value: "aulas", label: "Aulas", color: "bg-purple-500" },
  { value: "financeiro", label: "Financeiro", color: "bg-yellow-500" },
  { value: "materiais", label: "Materiais", color: "bg-orange-500" },
  { value: "lembretes", label: "Lembretes", color: "bg-red-500" },
]

export default function NotesPage() {
  const { user } = useAuth()
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "geral"
  })

  useEffect(() => {
    if (user) {
      loadNotes()
    }
  }, [user])

  const loadNotes = async () => {
    if (!user) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })

      if (error) throw error
      setNotes(data || [])
    } catch (error) {
      console.error("Erro ao carregar anotações:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar as anotações.",
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
      if (editingNote) {
        const { error } = await supabase
          .from("notes")
          .update({
            title: formData.title,
            content: formData.content,
            category: formData.category,
            updated_at: new Date().toISOString()
          })
          .eq("id", editingNote.id)

        if (error) throw error

        toast({
          title: "Sucesso",
          description: "Anotação atualizada com sucesso!",
        })
      } else {
        const { error } = await supabase
          .from("notes")
          .insert({
            title: formData.title,
            content: formData.content,
            category: formData.category,
            user_id: user.id
          })

        if (error) throw error

        toast({
          title: "Sucesso",
          description: "Anotação criada com sucesso!",
        })
      }

      setFormData({ title: "", content: "", category: "geral" })
      setEditingNote(null)
      setDialogOpen(false)
      loadNotes()
    } catch (error) {
      console.error("Erro ao salvar anotação:", error)
      toast({
        title: "Erro",
        description: "Não foi possível salvar a anotação.",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (note: Note) => {
    setEditingNote(note)
    setFormData({
      title: note.title,
      content: note.content,
      category: note.category
    })
    setDialogOpen(true)
  }

  const handleDelete = async (noteId: string) => {
    try {
      const { error } = await supabase
        .from("notes")
        .delete()
        .eq("id", noteId)

      if (error) throw error

      toast({
        title: "Sucesso",
        description: "Anotação excluída com sucesso!",
      })
      loadNotes()
    } catch (error) {
      console.error("Erro ao excluir anotação:", error)
      toast({
        title: "Erro",
        description: "Não foi possível excluir a anotação.",
        variant: "destructive",
      })
    }
  }

  const getCategoryInfo = (category: string) => {
    return categories.find(cat => cat.value === category) || categories[0]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         note.content.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "" || note.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
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
          <h1 className="text-3xl font-bold text-green-800 dark:text-green-400">Anotações e Lembretes</h1>
          <p className="text-green-600 dark:text-green-500 mt-2">Organize suas ideias e lembretes importantes</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600">
              <Plus className="w-4 h-4 mr-2" />
              Nova Anotação
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingNote ? "Editar Anotação" : "Nova Anotação"}</DialogTitle>
              <DialogDescription>
                {editingNote ? "Atualize sua anotação." : "Crie uma nova anotação ou lembrete."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Digite o título da anotação"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                >
                  {categories.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Conteúdo</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Digite o conteúdo da sua anotação..."
                  rows={8}
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => {
                  setDialogOpen(false)
                  setEditingNote(null)
                  setFormData({ title: "", content: "", category: "geral" })
                }}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-green-600 hover:bg-green-700">
                  {editingNote ? "Atualizar" : "Criar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Buscar anotações..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        >
          <option value="">Todas as categorias</option>
          {categories.map((category) => (
            <option key={category.value} value={category.value}>
              {category.label}
            </option>
          ))}
        </select>
      </div>

      {/* Lista de Anotações */}
      {filteredNotes.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <StickyNote className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <CardTitle className="text-xl mb-2 text-gray-600 dark:text-gray-400">
              {notes.length === 0 ? "Nenhuma anotação ainda" : "Nenhuma anotação encontrada"}
            </CardTitle>
            <CardDescription className="mb-4">
              {notes.length === 0 
                ? "Crie sua primeira anotação para começar a organizar suas ideias."
                : "Tente ajustar os filtros de busca."}
            </CardDescription>
            {notes.length === 0 && (
              <Button 
                onClick={() => setDialogOpen(true)}
                className="bg-green-600 hover:bg-green-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeira Anotação
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNotes.map((note) => {
            const categoryInfo = getCategoryInfo(note.category)
            return (
              <Card key={note.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg line-clamp-2">{note.title}</CardTitle>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className={`${categoryInfo.color} text-white text-xs`}>
                          {categoryInfo.label}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-1 ml-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(note)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir Anotação</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir esta anotação? Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(note.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-4 mb-4">
                    {note.content}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>Criado: {formatDate(note.created_at)}</span>
                    </div>
                    {note.updated_at !== note.created_at && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>Editado: {formatDate(note.updated_at)}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}