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
import { Checkbox } from "@/components/ui/checkbox"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "@/hooks/use-toast"
import {
  Plus,
  Edit,
  Trash2,
  Users,
  Clock,
  Eye,
  Calendar,
  BookOpen,
  Search,
  X,
  UserPlus,
} from "lucide-react"

interface Class {
  id: string
  name: string
  schedule: string
  days: string[]
  level: string
  observations?: string
  created_at: string
}

interface Student {
  id: string
  name: string
}

interface ClassStudent {
  id: string
  class_id: string
  student_id: string
  student_name: string
}

const daysOfWeek = [
  { value: "monday", label: "Segunda-feira" },
  { value: "tuesday", label: "Terça-feira" },
  { value: "wednesday", label: "Quarta-feira" },
  { value: "thursday", label: "Quinta-feira" },
  { value: "friday", label: "Sexta-feira" },
  { value: "saturday", label: "Sábado" },
  { value: "sunday", label: "Domingo" },
]

const levels = [
  "Iniciante",
  "Básico",
  "Intermediário",
  "Avançado",
  "Profissional",
]

export default function ClassesPage() {
  const { user } = useAuth()
  const [classes, setClasses] = useState<Class[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [classStudents, setClassStudents] = useState<ClassStudent[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [editingClass, setEditingClass] = useState<Class | null>(null)
  const [viewingClass, setViewingClass] = useState<Class | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    schedule: "",
    days: [] as string[],
    level: "",
    observations: "",
  })
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [studentSearch, setStudentSearch] = useState("")
  const [showAddStudent, setShowAddStudent] = useState(false)
  const [newStudentName, setNewStudentName] = useState("")

  useEffect(() => {
    if (user) {
      fetchClasses()
      fetchStudents()
      fetchClassStudents()
    }
  }, [user])

  const fetchClasses = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from("classes")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      setClasses(data || [])
    } catch (error) {
      console.error("Erro ao carregar turmas:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar as turmas.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchStudents = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from("students")
        .select("id, name")
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("name")

      if (error) throw error
      setStudents(data || [])
    } catch (error) {
      console.error("Erro ao carregar alunos:", error)
    }
  }

  const fetchClassStudents = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from("class_students")
        .select(`
          id,
          class_id,
          student_id,
          students!inner(name)
        `)
        .eq("user_id", user.id)

      if (error) throw error
      
      const formattedData = data?.map(item => ({
        id: item.id,
        class_id: item.class_id,
        student_id: item.student_id,
        student_name: (item.students as any)?.name || ""
      })) || []
      
      setClassStudents(formattedData)
    } catch (error) {
      console.error("Erro ao carregar alunos das turmas:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      const classData = {
        ...formData,
        user_id: user.id,
      }

      let classId: string

      if (editingClass) {
        const { error } = await supabase
          .from("classes")
          .update(classData)
          .eq("id", editingClass.id)

        if (error) throw error
        classId = editingClass.id

        // Atualizar alunos da turma
        await updateClassStudents(classId)

        toast({
          title: "Sucesso",
          description: "Turma atualizada com sucesso!",
        })
      } else {
        const { data, error } = await supabase
          .from("classes")
          .insert([classData])
          .select()
          .single()

        if (error) throw error
        classId = data.id

        // Adicionar alunos à nova turma
        if (selectedStudents.length > 0) {
          await updateClassStudents(classId)
        }

        toast({
          title: "Sucesso",
          description: "Turma criada com sucesso!",
        })
      }

      setDialogOpen(false)
      setEditingClass(null)
      setFormData({
        name: "",
        schedule: "",
        days: [],
        level: "",
        observations: "",
      })
      setSelectedStudents([])
      setStudentSearch("")
      setShowAddStudent(false)
      setNewStudentName("")
      fetchClasses()
    } catch (error) {
      console.error("Erro ao salvar turma:", error)
      toast({
        title: "Erro",
        description: "Não foi possível salvar a turma.",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (classItem: Class) => {
    setEditingClass(classItem)
    setFormData({
      name: classItem.name,
      schedule: classItem.schedule,
      days: classItem.days,
      level: classItem.level,
      observations: classItem.observations || "",
    })
    // Carregar alunos já matriculados na turma
    const currentStudents = getClassStudents(classItem.id).map(cs => cs.student_id)
    setSelectedStudents(currentStudents)
    setDialogOpen(true)
  }

  const handleView = (classItem: Class) => {
    setViewingClass(classItem)
    setViewDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta turma?")) return

    try {
      const { error } = await supabase
        .from("classes")
        .delete()
        .eq("id", id)

      if (error) throw error

      toast({
        title: "Sucesso",
        description: "Turma excluída com sucesso!",
      })
      fetchClasses()
    } catch (error) {
      console.error("Erro ao excluir turma:", error)
      toast({
        title: "Erro",
        description: "Não foi possível excluir a turma.",
        variant: "destructive",
      })
    }
  }

  const handleDayChange = (day: string, checked: boolean) => {
    if (checked) {
      setFormData({ ...formData, days: [...formData.days, day] })
    } else {
      setFormData({ ...formData, days: formData.days.filter(d => d !== day) })
    }
  }

  const formatDays = (days: string[]) => {
    return days.map(day => {
      const dayObj = daysOfWeek.find(d => d.value === day)
      return dayObj ? dayObj.label : day
    }).join(", ")
  }

  const getClassStudents = (classId: string) => {
    return classStudents.filter(cs => cs.class_id === classId)
  }

  const addStudentToClass = (studentId: string) => {
    if (!selectedStudents.includes(studentId)) {
      setSelectedStudents([...selectedStudents, studentId])
    }
  }

  const removeStudentFromClass = (studentId: string) => {
    setSelectedStudents(selectedStudents.filter(id => id !== studentId))
  }

  const handleAddNewStudent = async () => {
    if (!newStudentName.trim() || !user) return

    try {
      const { data, error } = await supabase
        .from("students")
        .insert([{
          name: newStudentName.trim(),
          user_id: user.id,
          status: "active"
        }])
        .select()
        .single()

      if (error) throw error

      // Atualizar lista de alunos
      await fetchStudents()
      
      // Adicionar o novo aluno à seleção
      addStudentToClass(data.id)
      
      // Limpar formulário
      setNewStudentName("")
      setShowAddStudent(false)
      
      toast({
        title: "Sucesso",
        description: "Aluno criado e adicionado à turma!",
      })
    } catch (error) {
      console.error("Erro ao criar aluno:", error)
      toast({
        title: "Erro",
        description: "Não foi possível criar o aluno.",
        variant: "destructive",
      })
    }
  }

  const updateClassStudents = async (classId: string) => {
    if (!user) return

    try {
      // Remover todos os alunos atuais da turma
      await supabase
        .from("class_students")
        .delete()
        .eq("class_id", classId)
        .eq("user_id", user.id)

      // Adicionar os alunos selecionados
      if (selectedStudents.length > 0) {
        const classStudentData = selectedStudents.map(studentId => ({
          class_id: classId,
          student_id: studentId,
          user_id: user.id
        }))

        const { error } = await supabase
          .from("class_students")
          .insert(classStudentData)

        if (error) throw error
      }

      // Atualizar lista de alunos das turmas
      await fetchClassStudents()
    } catch (error) {
      console.error("Erro ao atualizar alunos da turma:", error)
      throw error
    }
  }

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(studentSearch.toLowerCase())
  )

  const getSelectedStudentNames = () => {
    return selectedStudents.map(id => {
      const student = students.find(s => s.id === id)
      return student ? student.name : ""
    }).filter(name => name)
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
          <h1 className="text-3xl font-bold text-green-800 dark:text-green-400">Gestão de Turmas</h1>
        <p className="text-green-600 dark:text-green-500 mt-2">Gerencie suas turmas e horários</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600">
              <Plus className="w-4 h-4 mr-2" />
              Nova Turma
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingClass ? "Editar Turma" : "Nova Turma"}</DialogTitle>
              <DialogDescription>
                {editingClass ? "Atualize as informações da turma." : "Adicione uma nova turma ao sistema."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome da Turma *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="Ex: Turma Manhã A"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="schedule">Horário *</Label>
                  <Input
                    id="schedule"
                    value={formData.schedule}
                    onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                    required
                    placeholder="Ex: 08:00 - 09:30"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Dias da Semana *</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {daysOfWeek.map((day) => (
                    <div key={day.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={day.value}
                        checked={formData.days.includes(day.value)}
                        onCheckedChange={(checked) => handleDayChange(day.value, checked as boolean)}
                      />
                      <Label htmlFor={day.value} className="text-sm">
                        {day.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="level">Nível *</Label>
                <Select value={formData.level} onValueChange={(value) => setFormData({ ...formData, level: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o nível" />
                  </SelectTrigger>
                  <SelectContent>
                    {levels.map((level) => (
                      <SelectItem key={level} value={level}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="observations">Observações</Label>
                <Textarea
                  id="observations"
                  value={formData.observations}
                  onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                  placeholder="Observações adicionais sobre a turma..."
                  rows={3}
                />
              </div>
              
              {/* Seção de Gerenciamento de Alunos */}
              <div className="space-y-4 border-t pt-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">Alunos da Turma</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddStudent(true)}
                    className="text-green-600 border-green-600 hover:bg-green-50"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Novo Aluno
                  </Button>
                </div>
                
                {/* Barra de Pesquisa */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Pesquisar alunos..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                {/* Alunos Selecionados */}
                {selectedStudents.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-600 dark:text-gray-400">Alunos Selecionados ({selectedStudents.length})</Label>
                    <div className="flex flex-wrap gap-2">
                      {getSelectedStudentNames().map((name, index) => {
                        const studentId = selectedStudents[index]
                        return (
                          <Badge key={studentId} variant="secondary" className="flex items-center gap-1">
                            {name}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-4 w-4 p-0 hover:bg-red-100"
                              onClick={() => removeStudentFromClass(studentId)}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </Badge>
                        )
                      })}
                    </div>
                  </div>
                )}
                
                {/* Lista de Alunos Disponíveis */}
                <div className="max-h-40 overflow-y-auto border rounded-md">
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map((student) => {
                      const isSelected = selectedStudents.includes(student.id)
                      return (
                        <div
                          key={student.id}
                          className={`flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${
                            isSelected ? "bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500" : ""
                          }`}
                          onClick={() => {
                            if (isSelected) {
                              removeStudentFromClass(student.id)
                            } else {
                              addStudentToClass(student.id)
                            }
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                            <span className="text-sm dark:text-gray-200">{student.name}</span>
                          </div>
                          {isSelected && (
                            <Badge className="bg-green-600 text-white text-xs">
                              Selecionado
                            </Badge>
                          )}
                        </div>
                      )
                    })
                  ) : (
                    <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                      {studentSearch ? "Nenhum aluno encontrado" : "Nenhum aluno cadastrado"}
                    </div>
                  )}
                </div>
                
                {/* Formulário para Adicionar Novo Aluno */}
                {showAddStudent && (
                  <div className="border rounded-md p-4 bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
                    <div className="flex items-center justify-between mb-3">
                      <Label className="text-sm font-medium">Adicionar Novo Aluno</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setShowAddStudent(false)
                          setNewStudentName("")
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Nome do aluno"
                        value={newStudentName}
                        onChange={(e) => setNewStudentName(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault()
                            handleAddNewStudent()
                          }
                        }}
                      />
                      <Button
                        type="button"
                        onClick={handleAddNewStudent}
                        disabled={!newStudentName.trim()}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Adicionar
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => {
                  setDialogOpen(false)
                  setEditingClass(null)
                  setFormData({
                    name: "",
                    schedule: "",
                    days: [],
                    level: "",
                    observations: "",
                  })
                  setSelectedStudents([])
                  setStudentSearch("")
                  setShowAddStudent(false)
                  setNewStudentName("")
                }}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-green-600 hover:bg-green-700">
                  {editingClass ? "Atualizar" : "Criar"} Turma
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* View Class Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              {viewingClass?.name}
            </DialogTitle>
            <DialogDescription>Informações detalhadas da turma</DialogDescription>
          </DialogHeader>

          {viewingClass && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Horário</p>
                      <p className="font-medium">{viewingClass.schedule}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Dias da Semana</p>
                      <p className="font-medium">{formatDays(viewingClass.days)}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Nível</p>
                    <Badge className="bg-green-600 text-white">
                      {viewingClass.level}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Alunos Matriculados</p>
                    <p className="font-medium">{getClassStudents(viewingClass.id).length} alunos</p>
                  </div>
                </div>
              </div>
              
              {viewingClass.observations && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Observações</p>
                  <p className="text-sm bg-gray-50 dark:bg-gray-700 dark:text-gray-200 p-3 rounded">{viewingClass.observations}</p>
                </div>
              )}
              
              <div>
                <p className="text-sm text-gray-500 mb-2">Alunos da Turma</p>
                {getClassStudents(viewingClass.id).length > 0 ? (
                  <div className="space-y-2">
                    {getClassStudents(viewingClass.id).map((cs) => (
                      <div key={cs.id} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded">
                        <Users className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        <span className="text-sm dark:text-gray-200">{cs.student_name}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Nenhum aluno matriculado nesta turma</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {classes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Nenhuma turma cadastrada</h3>
            <p className="text-gray-500 text-center mb-4">Comece criando sua primeira turma.</p>
            <Button onClick={() => setDialogOpen(true)} className="bg-green-600 hover:bg-green-700">
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeira Turma
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((classItem) => (
            <Card key={classItem.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{classItem.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className="bg-green-600 text-white">
                        {classItem.level}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>{classItem.schedule}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDays(classItem.days)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="w-4 h-4" />
                    <span>{getClassStudents(classItem.id).length} alunos</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleView(classItem)}
                    className="flex-1"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(classItem)}
                    className="flex-1"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(classItem.id)}
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
