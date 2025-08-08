"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import {
  Plus,
  Edit,
  Trash2,
  Users,
  Mail,
  Phone,
  Eye,
  Calendar as CalendarIcon,
  MapPin,
  AlertTriangle,
  DollarSign,
  FileText,
  Download,
  X,
  Image,
  ExternalLink,
} from "lucide-react"
import { StudentInvoicesHistory } from "@/components/student-invoices-history"
import { DatePicker } from "@/components/ui/date-picker"

interface Student {
  id: string
  name: string
  email: string
  phone: string
  badge_color: string
  badge_description: string
  birth_date?: string
  address?: string
  emergency_contact?: string
  emergency_phone?: string
  medical_info?: string
  monthly_fee_type: string
  monthly_fee_amount?: number
  payment_day?: number
  discount_percentage?: number
  notes?: string
  documents?: any[]
  status: string
  enrollment_date?: string
  created_at: string
}

interface DocumentFile {
  name: string
  url: string
  type: string
  size: number
  uploaded_at: string
}

const badgeOptions = [
  { color: "red", description: "Bola Vermelha", bgColor: "bg-red-500" },
  { color: "orange", description: "Bola Laranja", bgColor: "bg-orange-500" },
  { color: "green", description: "Bola Verde", bgColor: "bg-green-500" },
  { color: "yellow", description: "Bola Amarela", bgColor: "bg-yellow-500" },
]

const feeTypes = [
  { value: "monthly", label: "Mensalidade" },
  { value: "weekly", label: "Semanal" },
  { value: "per_class", label: "Por Aula" },
  { value: "package", label: "Pacote" },
]

const statusOptions = [
  { value: "active", label: "Ativo", color: "bg-green-500" },
  { value: "inactive", label: "Inativo", color: "bg-gray-500" },
  { value: "suspended", label: "Suspenso", color: "bg-red-500" },
  { value: "trial", label: "Experimental", color: "bg-blue-500" },
]

export default function StudentsPage() {
  const { user } = useAuth()
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null)
  const [uploadingFiles, setUploadingFiles] = useState<File[]>([])  
  const [previewFile, setPreviewFile] = useState<{url: string, name: string, type: string} | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    badge_color: "",
    badge_description: "",
    birth_date: "",
    address: "",
    emergency_contact: "",
    emergency_phone: "",
    medical_info: "",
    monthly_fee_type: "monthly",
    monthly_fee_amount: "",
    payment_day: "5",
    discount_percentage: "0",
    notes: "",
    status: "active",
    enrollment_date: new Date().toISOString().split("T")[0],
  })

  useEffect(() => {
    if (user) {
      fetchStudents()
    }
  }, [user])

  const fetchStudents = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase.from("students").select("*").eq("user_id", user.id).order("name")

      if (error) throw error
      setStudents(data || [])
    } catch (error) {
      toast({
        title: "Erro ao carregar alunos",
        description: "Não foi possível carregar a lista de alunos.",
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
      // Processar documentos se houver arquivos para upload
      let documents: DocumentFile[] = []
      if (uploadingFiles.length > 0) {
        documents = uploadingFiles.map((file) => ({
          name: file.name,
          url: URL.createObjectURL(file), // Em produção, fazer upload real
          type: file.type,
          size: file.size,
          uploaded_at: new Date().toISOString(),
        }))
      }

      // Preparar dados apenas com campos que têm valores
      const studentData: any = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        badge_color: formData.badge_color,
        badge_description: formData.badge_description,
        monthly_fee_type: formData.monthly_fee_type,
        status: formData.status,
        user_id: user.id,
      }

      // Adicionar campos opcionais apenas se não estiverem vazios
      if (formData.birth_date) studentData.birth_date = formData.birth_date
      if (formData.address) studentData.address = formData.address
      if (formData.emergency_contact) studentData.emergency_contact = formData.emergency_contact
      if (formData.emergency_phone) studentData.emergency_phone = formData.emergency_phone
      if (formData.medical_info) studentData.medical_info = formData.medical_info
      if (formData.monthly_fee_amount) studentData.monthly_fee_amount = Number.parseFloat(formData.monthly_fee_amount)
      if (formData.payment_day) studentData.payment_day = Number.parseInt(formData.payment_day)
      if (formData.discount_percentage)
        studentData.discount_percentage = Number.parseFloat(formData.discount_percentage)
      if (formData.notes) studentData.notes = formData.notes
      if (formData.enrollment_date) studentData.enrollment_date = formData.enrollment_date

      // Adicionar documentos se houver
      if (documents.length > 0 || (editingStudent?.documents && editingStudent.documents.length > 0)) {
        studentData.documents = editingStudent ? [...(editingStudent.documents || []), ...documents] : documents
      }

      if (editingStudent) {
        // Verificar se o valor da mensalidade foi alterado
        const oldFeeAmount = editingStudent.monthly_fee_amount
        const newFeeAmount = studentData.monthly_fee_amount
        const feeAmountChanged = oldFeeAmount !== newFeeAmount

        const { error } = await supabase.from("students").update(studentData).eq("id", editingStudent.id)

        if (error) throw error

        // Se o valor da mensalidade foi alterado, atualizar todas as faturas pendentes do aluno
        if (feeAmountChanged && newFeeAmount) {
          const { error: invoiceError } = await supabase
            .from("invoices")
            .update({ amount: newFeeAmount })
            .eq("student_id", editingStudent.id)
            .eq("status", "pending")

          if (invoiceError) {
            console.error("Erro ao atualizar faturas:", invoiceError)
            toast({
              title: "Aluno atualizado com aviso",
              description: "O aluno foi atualizado, mas houve um problema ao sincronizar as faturas pendentes.",
              variant: "destructive",
            })
          } else {
            toast({
              title: "Aluno e faturas atualizados!",
              description: `As informações do aluno foram atualizadas e todas as faturas pendentes foram sincronizadas com o novo valor de R$ ${newFeeAmount.toFixed(2)}.`,
            })
          }
        } else {
          toast({
            title: "Aluno atualizado!",
            description: "As informações do aluno foram atualizadas com sucesso.",
          })
        }
      } else {
        const { error } = await supabase.from("students").insert([studentData])

        if (error) throw error
        toast({
          title: "Aluno cadastrado!",
          description: "O aluno foi adicionado com sucesso.",
        })
      }

      setDialogOpen(false)
      setEditingStudent(null)
      setUploadingFiles([])
      resetForm()
      fetchStudents()
    } catch (error: any) {
      console.error("Erro ao salvar aluno:", error)
      toast({
        title: "Erro ao salvar aluno",
        description: error.message || "Não foi possível salvar as informações do aluno.",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (student: Student) => {
    setEditingStudent(student)
    setFormData({
      name: student.name,
      email: student.email,
      phone: student.phone,
      badge_color: student.badge_color,
      badge_description: student.badge_description,
      birth_date: student.birth_date || "",
      address: student.address || "",
      emergency_contact: student.emergency_contact || "",
      emergency_phone: student.emergency_phone || "",
      medical_info: student.medical_info || "",
      monthly_fee_type: student.monthly_fee_type || "monthly",
      monthly_fee_amount: student.monthly_fee_amount?.toString() || "",
      payment_day: student.payment_day?.toString() || "5",
      discount_percentage: student.discount_percentage?.toString() || "0",
      notes: student.notes || "",
      status: student.status || "active",
      enrollment_date: student.enrollment_date || new Date().toISOString().split("T")[0],
    })
    setDialogOpen(true)
  }

  const handleView = (student: Student) => {
    setViewingStudent(student)
    setViewDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este aluno?")) return

    try {
      const { error } = await supabase.from("students").delete().eq("id", id)

      if (error) throw error
      toast({
        title: "Aluno excluído!",
        description: "O aluno foi removido com sucesso.",
      })
      fetchStudents()
    } catch (error) {
      toast({
        title: "Erro ao excluir aluno",
        description: "Não foi possível excluir o aluno.",
        variant: "destructive",
      })
    }
  }

  const handleBadgeChange = (color: string) => {
    const badge = badgeOptions.find((b) => b.color === color)
    if (badge) {
      setFormData({
        ...formData,
        badge_color: badge.color,
        badge_description: badge.description,
      })
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setUploadingFiles([...uploadingFiles, ...files])
  }

  const removeFile = (index: number) => {
    setUploadingFiles(uploadingFiles.filter((_, i) => i !== index))
  }

  const getFileIcon = (fileName: string, fileType?: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase()
    const type = fileType?.toLowerCase()
    
    if (type?.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) {
      return <Image className="w-4 h-4" />
    }
    return <FileText className="w-4 h-4" />
  }

  const canPreviewFile = (fileName: string, fileType?: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase()
    const type = fileType?.toLowerCase()
    
    // Pode visualizar imagens e PDFs
    return type?.startsWith('image/') || 
           ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf'].includes(extension || '') ||
           type === 'application/pdf'
  }

  const previewFileInModal = (url: string, name: string, type: string) => {
    setPreviewFile({ url, name, type })
  }

  const removeExistingDocument = async (docIndex: number, studentId?: string) => {
    const targetStudent = studentId ? viewingStudent : editingStudent
    if (!targetStudent) return
    
    const updatedDocuments = targetStudent.documents?.filter((_, index) => index !== docIndex) || []
    
    try {
      const { error } = await supabase
        .from("students")
        .update({ documents: updatedDocuments })
        .eq("id", targetStudent.id)
      
      if (error) throw error
      
      if (studentId && viewingStudent) {
        setViewingStudent({
          ...viewingStudent,
          documents: updatedDocuments
        })
      } else if (editingStudent) {
        setEditingStudent({
          ...editingStudent,
          documents: updatedDocuments
        })
      }
      
      // Atualizar a lista de estudantes também
      setStudents(students.map(student => 
        student.id === targetStudent.id 
          ? { ...student, documents: updatedDocuments }
          : student
      ))
      
      toast({
        title: "Documento removido!",
        description: "O documento foi removido com sucesso.",
      })
    } catch (error) {
      toast({
        title: "Erro ao remover documento",
        description: "Não foi possível remover o documento.",
        variant: "destructive",
      })
    }
  }

  const getBadgeColor = (color: string) => {
    const badge = badgeOptions.find((b) => b.color === color)
    return badge?.bgColor || "bg-gray-500"
  }

  const getStatusColor = (status: string) => {
    const statusOption = statusOptions.find((s) => s.value === status)
    return statusOption?.color || "bg-gray-500"
  }

  const getStatusLabel = (status: string) => {
    const statusOption = statusOptions.find((s) => s.value === status)
    return statusOption?.label || status
  }

  const getFeeTypeLabel = (type: string) => {
    const feeType = feeTypes.find((f) => f.value === type)
    return feeType?.label || type
  }

  const formatCurrency = (value?: number) => {
    if (!value) return "R$ 0,00"
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-"
    return new Date(dateString).toLocaleDateString("pt-BR")
  }

  const calculateAge = (birthDate?: string) => {
    if (!birthDate) return "-"
    const today = new Date()
    const birth = new Date(birthDate)
    const age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      return age - 1
    }
    return age
  }

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      badge_color: "",
      badge_description: "",
      birth_date: "",
      address: "",
      emergency_contact: "",
      emergency_phone: "",
      medical_info: "",
      monthly_fee_type: "monthly",
      monthly_fee_amount: "",
      payment_day: "5",
      discount_percentage: "0",
      notes: "",
      status: "active",
      enrollment_date: new Date().toISOString().split("T")[0],
    })
    setUploadingFiles([])
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
          <h1 className="text-3xl font-bold text-green-800 dark:text-green-400">Gestão de Alunos</h1>
        <p className="text-green-600 dark:text-green-500 mt-2">Gerencie seus alunos e suas informações completas</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600">
              <Plus className="w-4 h-4 mr-2" />
              Novo Aluno
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingStudent ? "Editar Aluno" : "Novo Aluno"}</DialogTitle>
              <DialogDescription>
                {editingStudent ? "Atualize as informações do aluno." : "Adicione um novo aluno ao sistema."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="basic">Básico</TabsTrigger>
                  <TabsTrigger value="contact">Contato</TabsTrigger>
                  <TabsTrigger value="financial">Financeiro</TabsTrigger>
                  <TabsTrigger value="documents">Documentos</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome Completo *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        placeholder="Ex: João Silva"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="birth_date">Data de Nascimento</Label>
                      <DatePicker
                        value={formData.birth_date || ''}
                        onChange={(date) => setFormData({ ...formData, birth_date: date })}
                        placeholder="Selecione a data de nascimento"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="badge">Nível (Badge) *</Label>
                      <Select value={formData.badge_color} onValueChange={handleBadgeChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o nível do aluno" />
                        </SelectTrigger>
                        <SelectContent>
                          {badgeOptions.map((badge) => (
                            <SelectItem key={badge.color} value={badge.color}>
                              <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${badge.bgColor}`}></div>
                                {badge.description}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value) => setFormData({ ...formData, status: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                        <SelectContent>
                          {statusOptions.map((status) => (
                            <SelectItem key={status.value} value={status.value}>
                              <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${status.color}`}></div>
                                {status.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="enrollment_date">Data de Matrícula</Label>
                    <DatePicker
                      value={formData.enrollment_date || ''}
                      onChange={(date) => setFormData({ ...formData, enrollment_date: date })}
                      placeholder="Selecione a data de matrícula"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="contact" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                        placeholder="joao@email.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefone *</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        required
                        placeholder="(11) 99999-9999"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Endereço</Label>
                    <Textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Endereço completo..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="emergency_contact">Contato de Emergência</Label>
                      <Input
                        id="emergency_contact"
                        value={formData.emergency_contact}
                        onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
                        placeholder="Nome do responsável"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emergency_phone">Telefone de Emergência</Label>
                      <Input
                        id="emergency_phone"
                        value={formData.emergency_phone}
                        onChange={(e) => setFormData({ ...formData, emergency_phone: e.target.value })}
                        placeholder="(11) 99999-9999"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="medical_info">Informações Médicas</Label>
                    <Textarea
                      id="medical_info"
                      value={formData.medical_info}
                      onChange={(e) => setFormData({ ...formData, medical_info: e.target.value })}
                      placeholder="Alergias, medicamentos, restrições..."
                    />
                  </div>
                </TabsContent>

                <TabsContent value="financial" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="monthly_fee_type">Tipo de Mensalidade</Label>
                      <Select
                        value={formData.monthly_fee_type}
                        onValueChange={(value) => setFormData({ ...formData, monthly_fee_type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          {feeTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="monthly_fee_amount">Valor (R$)</Label>
                      <Input
                        id="monthly_fee_amount"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.monthly_fee_amount}
                        onChange={(e) => setFormData({ ...formData, monthly_fee_amount: e.target.value })}
                        placeholder="150.00"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="payment_day">Dia do Vencimento</Label>
                      <Select
                        value={formData.payment_day}
                        onValueChange={(value) => setFormData({ ...formData, payment_day: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Dia do mês" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                            <SelectItem key={day} value={day.toString()}>
                              Dia {day}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="discount_percentage">Desconto (%)</Label>
                      <Input
                        id="discount_percentage"
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={formData.discount_percentage}
                        onChange={(e) => setFormData({ ...formData, discount_percentage: e.target.value })}
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Observações Financeiras</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Observações sobre pagamentos, acordos especiais..."
                    />
                  </div>
                </TabsContent>

                <TabsContent value="documents" className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="documents">Anexar Documentos</Label>
                      <div className="mt-2">
                        <Input
                          id="documents"
                          type="file"
                          multiple
                          onChange={handleFileUpload}
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp"
                        />
                        <p className="text-sm text-gray-500 mt-1">Formatos aceitos: PDF, DOC, DOCX, JPG, JPEG, PNG, GIF, WEBP</p>
                      </div>
                    </div>

                    {uploadingFiles.length > 0 && (
                      <div className="space-y-2">
                        <Label>Arquivos para Upload:</Label>
                        {uploadingFiles.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-2 border rounded">
                            <div className="flex items-center gap-2">
                              {getFileIcon(file.name, file.type)}
                              <span className="text-sm">{file.name}</span>
                              <span className="text-xs text-gray-500">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                            </div>
                            <div className="flex gap-1">
                              {canPreviewFile(file.name, file.type) && (
                                <Button 
                                  type="button" 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => previewFileInModal(URL.createObjectURL(file), file.name, file.type)}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                              )}
                              <Button type="button" variant="outline" size="sm" onClick={() => removeFile(index)}>
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {editingStudent?.documents && editingStudent.documents.length > 0 && (
                      <div className="space-y-2">
                        <Label>Documentos Existentes:</Label>
                        {editingStudent.documents.map((doc: DocumentFile, index: number) => (
                          <div key={index} className="flex items-center justify-between p-2 border rounded">
                            <div className="flex items-center gap-2">
                              {getFileIcon(doc.name, doc.type)}
                              <span className="text-sm">{doc.name}</span>
                              <span className="text-xs text-gray-500">{formatDate(doc.uploaded_at)}</span>
                            </div>
                            <div className="flex gap-1">
                              {canPreviewFile(doc.name, doc.type) && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => previewFileInModal(doc.url, doc.name, doc.type)}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                              )}
                              <Button
                                 type="button"
                                 variant="outline"
                                 size="sm"
                                 onClick={() => window.open(doc.url, "_blank")}
                               >
                                 <Download className="w-4 h-4" />
                               </Button>
                               <Button
                                 type="button"
                                 variant="outline"
                                 size="sm"
                                 onClick={() => removeExistingDocument(index)}
                                 className="text-red-600 hover:text-red-700"
                               >
                                 <X className="w-4 h-4" />
                               </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setDialogOpen(false)
                    setEditingStudent(null)
                    resetForm()
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit" className="bg-green-600 hover:bg-green-700">
                  {editingStudent ? "Atualizar" : "Cadastrar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* View Student Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              {viewingStudent?.name}
            </DialogTitle>
            <DialogDescription>Informações completas do aluno</DialogDescription>
          </DialogHeader>

          {viewingStudent && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className={`${getBadgeColor(viewingStudent.badge_color)} text-white text-lg`}>
                    {viewingStudent.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold">{viewingStudent.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={`${getBadgeColor(viewingStudent.badge_color)} text-white`}>
                      {viewingStudent.badge_description}
                    </Badge>
                    <Badge className={`${getStatusColor(viewingStudent.status)} text-white`}>
                      {getStatusLabel(viewingStudent.status)}
                    </Badge>
                  </div>
                </div>
              </div>

              <Tabs defaultValue="personal" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="personal">Pessoal</TabsTrigger>
                  <TabsTrigger value="contact">Contato</TabsTrigger>
                  <TabsTrigger value="financial">Financeiro</TabsTrigger>
                  <TabsTrigger value="documents">Documentos</TabsTrigger>
                </TabsList>

                <TabsContent value="personal" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4 text-gray-500" />
                        <div>
                          <p className="text-sm text-gray-500">Data de Nascimento</p>
                          <p className="font-medium">
                            {formatDate(viewingStudent.birth_date)}
                            {viewingStudent.birth_date && ` (${calculateAge(viewingStudent.birth_date)} anos)`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4 text-gray-500" />
                        <div>
                          <p className="text-sm text-gray-500">Data de Matrícula</p>
                          <p className="font-medium">{formatDate(viewingStudent.enrollment_date)}</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-500">Nível Atual</p>
                        <Badge className={`${getBadgeColor(viewingStudent.badge_color)} text-white`}>
                          {viewingStudent.badge_description}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Status</p>
                        <Badge className={`${getStatusColor(viewingStudent.status)} text-white`}>
                          {getStatusLabel(viewingStudent.status)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="contact" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-500" />
                        <div>
                          <p className="text-sm text-gray-500">Email</p>
                          <p className="font-medium">{viewingStudent.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-500" />
                        <div>
                          <p className="text-sm text-gray-500">Telefone</p>
                          <p className="font-medium">{viewingStudent.phone}</p>
                        </div>
                      </div>
                      {viewingStudent.address && (
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-gray-500 mt-1" />
                          <div>
                            <p className="text-sm text-gray-500">Endereço</p>
                            <p className="font-medium">{viewingStudent.address}</p>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="space-y-3">
                      {viewingStudent.emergency_contact && (
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-orange-500" />
                          <div>
                            <p className="text-sm text-gray-500">Contato de Emergência</p>
                            <p className="font-medium">{viewingStudent.emergency_contact}</p>
                            {viewingStudent.emergency_phone && (
                              <p className="text-sm text-gray-600">{viewingStudent.emergency_phone}</p>
                            )}
                          </div>
                        </div>
                      )}
                      {viewingStudent.medical_info && (
                        <div>
                          <p className="text-sm text-gray-500">Informações Médicas</p>
                          <p className="font-medium">{viewingStudent.medical_info}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="financial" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        <div>
                          <p className="text-sm text-gray-500">Tipo de Mensalidade</p>
                          <p className="font-medium">{getFeeTypeLabel(viewingStudent.monthly_fee_type)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        <div>
                          <p className="text-sm text-gray-500">Valor</p>
                          <p className="font-medium text-lg">{formatCurrency(viewingStudent.monthly_fee_amount)}</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-500">Dia do Vencimento</p>
                        <p className="font-medium">Dia {viewingStudent.payment_day}</p>
                      </div>
                      {viewingStudent.discount_percentage && viewingStudent.discount_percentage > 0 && (
                        <div>
                          <p className="text-sm text-gray-500">Desconto</p>
                          <p className="font-medium text-green-600">{viewingStudent.discount_percentage}%</p>
                        </div>
                      )}
                    </div>
                  </div>
                  {viewingStudent.notes && (
                    <div>
                      <p className="text-sm text-gray-500">Observações</p>
                      <p className="font-medium">{viewingStudent.notes}</p>
                    </div>
                  )}

                  {/* Histórico de Faturas */}
                  <div className="border-t pt-4 mt-6">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Histórico de Faturas
                    </h4>
                    <StudentInvoicesHistory studentId={viewingStudent.id} />
                  </div>
                </TabsContent>

                <TabsContent value="documents" className="space-y-4">
                  {viewingStudent.documents && viewingStudent.documents.length > 0 ? (
                    <div className="space-y-3">
                      {viewingStudent.documents.map((doc: DocumentFile, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            {getFileIcon(doc.name, doc.type)}
                            <div>
                              <p className="font-medium">{doc.name}</p>
                              <p className="text-sm text-gray-500">Enviado em {formatDate(doc.uploaded_at)}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {canPreviewFile(doc.name, doc.type) && (
                              <Button variant="outline" size="sm" onClick={() => previewFileInModal(doc.url, doc.name, doc.type)}>
                                <Eye className="w-4 h-4 mr-2" />
                                Visualizar
                              </Button>
                            )}
                            <Button variant="outline" size="sm" onClick={() => window.open(doc.url, "_blank")}>
                               <Download className="w-4 h-4 mr-2" />
                               Baixar
                             </Button>
                             <Button 
                               variant="outline" 
                               size="sm" 
                               onClick={() => removeExistingDocument(index, viewingStudent.id)}
                               className="text-red-600 hover:text-red-700"
                             >
                               <X className="w-4 h-4 mr-2" />
                               Remover
                             </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">Nenhum documento anexado</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {students.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Nenhum aluno cadastrado</h3>
            <p className="text-gray-500 text-center mb-4">Comece adicionando seu primeiro aluno.</p>
            <Button onClick={() => setDialogOpen(true)} className="bg-green-600 hover:bg-green-700">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Primeiro Aluno
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {students.map((student) => (
            <Card key={student.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className={`${getBadgeColor(student.badge_color)} text-white`}>
                        {student.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{student.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={`${getBadgeColor(student.badge_color)} text-white text-xs`}>
                          {student.badge_description}
                        </Badge>
                        <Badge className={`${getStatusColor(student.status)} text-white text-xs`}>
                          {getStatusLabel(student.status)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="w-4 h-4" />
                    <span>{student.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4" />
                    <span>{student.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <DollarSign className="w-4 h-4" />
                    <span>
                      {formatCurrency(student.monthly_fee_amount)} - {getFeeTypeLabel(student.monthly_fee_type)}
                    </span>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleView(student)}>
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleEdit(student)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(student.id)}
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

      {/* File Preview Dialog */}
      <Dialog open={!!previewFile} onOpenChange={() => setPreviewFile(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {previewFile && getFileIcon(previewFile.name, previewFile.type)}
              {previewFile?.name}
            </DialogTitle>
            <DialogDescription>
              Visualização do arquivo
            </DialogDescription>
          </DialogHeader>
          
          {previewFile && (
            <div className="flex-1 overflow-hidden">
              {previewFile.type.startsWith('image/') || 
               ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(previewFile.name.split('.').pop()?.toLowerCase() || '') ? (
                <div className="flex justify-center items-center h-[60vh] bg-gray-50 rounded-lg">
                  <img 
                    src={previewFile.url} 
                    alt={previewFile.name}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              ) : previewFile.type === 'application/pdf' || previewFile.name.toLowerCase().endsWith('.pdf') ? (
                <div className="h-[60vh] w-full">
                  <iframe 
                    src={previewFile.url} 
                    className="w-full h-full border-0 rounded-lg"
                    title={previewFile.name}
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[60vh] bg-gray-50 rounded-lg">
                  <FileText className="w-16 h-16 text-gray-400 mb-4" />
                  <p className="text-gray-600 mb-2">Não é possível visualizar este tipo de arquivo</p>
                  <Button 
                    variant="outline" 
                    onClick={() => window.open(previewFile.url, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Abrir em nova aba
                  </Button>
                </div>
              )}
            </div>
          )}
          
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setPreviewFile(null)}>
              Fechar
            </Button>
            {previewFile && (
              <Button 
                variant="outline" 
                onClick={() => window.open(previewFile.url, '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Abrir em nova aba
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
