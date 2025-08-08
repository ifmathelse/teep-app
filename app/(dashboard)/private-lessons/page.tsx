"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "@/hooks/use-toast"
import { Plus, Edit, Trash2, Clock, CalendarIcon, User } from "lucide-react"
import { DatePicker, Calendar } from "@/components/ui/date-picker"

interface PrivateLesson {
  id: string
  student_name: string
  student_id: string | null
  date: string
  time: string
  type: "regular" | "makeup" | "trial"
  notes: string
}

interface Student {
  id: string
  name: string
}

const lessonTypes = [
  { value: "regular", label: "Aula Regular", color: "bg-green-500" },
  { value: "makeup", label: "Aula de Reposição", color: "bg-blue-500" },
  { value: "trial", label: "Aula Experimental", color: "bg-purple-500" },
]

export default function PrivateLessonsPage() {
  const { user } = useAuth()
  const [lessons, setLessons] = useState<PrivateLesson[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingLesson, setEditingLesson] = useState<PrivateLesson | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [formData, setFormData] = useState({
    student_name: "",
    student_id: "",
    date: "",
    time: "",
    type: "regular" as "regular" | "makeup" | "trial",
    notes: "",
  })

  useEffect(() => {
    if (user) {
      fetchLessons()
      fetchStudents()
    }
  }, [user])

  const fetchLessons = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from("private_lessons")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: true })
        .order("time", { ascending: true })

      if (error) throw error
      setLessons(data || [])
    } catch (error) {
      toast({
        title: "Erro ao carregar aulas",
        description: "Não foi possível carregar a lista de aulas particulares.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchStudents = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase.from("students").select("id, name").eq("user_id", user.id).order("name")

      if (error) throw error
      setStudents(data || [])
    } catch (error) {
      console.error("Erro ao carregar alunos:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      const lessonData = {
        ...formData,
        student_id: formData.student_id || null,
        user_id: user.id,
      }

      if (editingLesson) {
        const { error } = await supabase.from("private_lessons").update(lessonData).eq("id", editingLesson.id)

        if (error) throw error
        toast({
          title: "Aula atualizada!",
          description: "As informações da aula foram atualizadas com sucesso.",
        })
      } else {
        const { error } = await supabase.from("private_lessons").insert([lessonData])

        if (error) throw error
        toast({
          title: "Aula agendada!",
          description: "A aula particular foi agendada com sucesso.",
        })
      }

      setDialogOpen(false)
      setEditingLesson(null)
      setFormData({ student_name: "", student_id: "", date: "", time: "", type: "regular", notes: "" })
      fetchLessons()
    } catch (error) {
      toast({
        title: "Erro ao salvar aula",
        description: "Não foi possível salvar as informações da aula.",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (lesson: PrivateLesson) => {
    setEditingLesson(lesson)
    setFormData({
      student_name: lesson.student_name,
      student_id: lesson.student_id || "",
      date: lesson.date,
      time: lesson.time,
      type: lesson.type,
      notes: lesson.notes,
    })
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta aula?")) return

    try {
      const { error } = await supabase.from("private_lessons").delete().eq("id", id)

      if (error) throw error
      toast({
        title: "Aula excluída!",
        description: "A aula foi removida com sucesso.",
      })
      fetchLessons()
    } catch (error) {
      toast({
        title: "Erro ao excluir aula",
        description: "Não foi possível excluir a aula.",
        variant: "destructive",
      })
    }
  }

  const handleStudentChange = (studentId: string) => {
    const student = students.find((s) => s.id === studentId)
    setFormData({
      ...formData,
      student_id: studentId,
      student_name: student?.name || "",
    })
  }

  // Função para formatar data no fuso horário local (YYYY-MM-DD)
  const formatDateToLocal = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  const handleCalendarDateChange = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date)
      const dateString = formatDateToLocal(date)
      setFormData({
        ...formData,
        date: dateString,
      })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR")
  }

  const formatTime = (timeString: string) => {
    return timeString.slice(0, 5)
  }

  const getLessonTypeInfo = (type: string) => {
    return lessonTypes.find((t) => t.value === type) || lessonTypes[0]
  }

  const getSelectedDateLessons = () => {
    const selectedDateStr = formatDateToLocal(selectedDate)
    return lessons.filter((lesson) => lesson.date === selectedDateStr)
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-green-800 dark:text-green-400">Aulas Particulares</h1>
          <p className="text-green-600 dark:text-green-500 mt-2">Gerencie suas aulas individuais e experimentais</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600">
              <Plus className="w-4 h-4 mr-2" />
              Nova Aula
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingLesson ? "Editar Aula" : "Nova Aula Particular"}</DialogTitle>
              <DialogDescription>
                {editingLesson ? "Atualize as informações da aula." : "Agende uma nova aula particular."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="student">Aluno</Label>
                  <Select value={formData.student_id} onValueChange={handleStudentChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um aluno" />
                    </SelectTrigger>
                    <SelectContent>
                      {students.map((student) => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="student_name">Nome do Aluno</Label>
                  <Input
                    id="student_name"
                    value={formData.student_name}
                    onChange={(e) => setFormData({ ...formData, student_name: e.target.value })}
                    required
                    placeholder="Nome completo do aluno"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Data</Label>
                  <Popover modal={false}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.date ? new Date(formData.date).toLocaleDateString('pt-BR') : "Selecione a data"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                    mode="single"
                    selected={formData.date ? new Date(formData.date) : undefined}
                    onSelect={(date) => {
                      if (date) {
                        setFormData({ ...formData, date: formatDateToLocal(date) })
                      }
                    }}
                    className="rounded-md border shadow-sm"
                    captionLayout="dropdown"
                    initialFocus
                  />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Horário</Label>
                  <Input
                    id="time"
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Tipo de Aula</Label>
                <Select value={formData.type} onValueChange={(value: any) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {lessonTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${type.color}`}></div>
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Observações sobre a aula..."
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setDialogOpen(false)
                    setEditingLesson(null)
                    setFormData({ student_name: "", student_id: "", date: "", time: "", type: "regular", notes: "" })
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit" className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600">
                  {editingLesson ? "Atualizar" : "Agendar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calendar Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              Calendário
            </CardTitle>
            <CardDescription>Selecione uma data para ver as aulas agendadas</CardDescription>
          </CardHeader>
          <CardContent>
            <DatePicker
              value={selectedDate ? formatDateToLocal(selectedDate) : ''}
              onChange={(date) => handleCalendarDateChange(new Date(date))}
              placeholder="Selecione a data"
            />
          </CardContent>
        </Card>

        {/* Selected Date Lessons */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Aulas do Dia - {formatDate(formatDateToLocal(selectedDate))}
            </CardTitle>
            <CardDescription>{getSelectedDateLessons().length} aula(s) agendada(s) para este dia</CardDescription>
          </CardHeader>
          <CardContent>
            {getSelectedDateLessons().length === 0 ? (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">Nenhuma aula agendada para este dia</p>
              </div>
            ) : (
              <div className="space-y-3">
                {getSelectedDateLessons()
                  .sort((a, b) => a.time.localeCompare(b.time))
                  .map((lesson) => {
                    const typeInfo = getLessonTypeInfo(lesson.type)
                    return (
                      <div key={lesson.id} className="border rounded-lg p-3 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                            <span className="font-medium">{lesson.student_name}</span>
                          </div>
                          <Badge className={`${typeInfo.color} text-white`}>{typeInfo.label}</Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                          <Clock className="w-4 h-4" />
                          <span>{formatTime(lesson.time)}</span>
                        </div>
                        {lesson.notes && <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{lesson.notes}</p>}
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleEdit(lesson)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(lesson.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* All Lessons List */}
      <Card>
        <CardHeader>
          <CardTitle>Todas as Aulas</CardTitle>
          <CardDescription>Lista completa de aulas particulares agendadas</CardDescription>
        </CardHeader>
        <CardContent>
          {lessons.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Nenhuma aula agendada</h3>
              <p className="text-gray-500 dark:text-gray-400 text-center mb-4">Comece agendando sua primeira aula particular.</p>
              <Button onClick={() => setDialogOpen(true)} className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600">
                <Plus className="w-4 h-4 mr-2" />
                Agendar Primeira Aula
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {lessons.map((lesson) => {
                const typeInfo = getLessonTypeInfo(lesson.type)
                return (
                  <div key={lesson.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <User className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                        <div>
                          <h4 className="font-medium">{lesson.student_name}</h4>
                          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                            <span>{formatDate(lesson.date)}</span>
                            <span>{formatTime(lesson.time)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={`${typeInfo.color} text-white`}>{typeInfo.label}</Badge>
                        <Button variant="outline" size="sm" onClick={() => handleEdit(lesson)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(lesson.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    {lesson.notes && <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{lesson.notes}</p>}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
