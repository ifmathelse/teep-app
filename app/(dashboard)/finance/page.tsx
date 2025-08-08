"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { DollarSign, ChevronLeft, ChevronRight, Eye, FileText, AlertCircle, Trash2, MessageCircle } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "@/hooks/use-toast"

interface Student {
  id: string
  name: string
  email: string
  phone: string
  monthly_fee_type: string
  monthly_fee_amount: number
}

interface Invoice {
  id: string
  student_id: string
  student_name: string
  amount: number
  due_date: string
  status: "pending" | "paid" | "overdue"
  month_reference: string
  created_at: string
  user_id?: string
}

export default function FinancePage() {
  const { user } = useAuth()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [students, setStudents] = useState<Student[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [isGeneratingInvoices, setIsGeneratingInvoices] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tableExists, setTableExists] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [invoiceToDelete, setInvoiceToDelete] = useState<string | null>(null)
  const [isDeletingInvoice, setIsDeletingInvoice] = useState(false)
  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false)
  const [isDeletingAllInvoices, setIsDeletingAllInvoices] = useState(false)

  const monthNames = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ]

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const getMonthReference = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
  }

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev)
      if (direction === "prev") {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  const checkTableExists = async () => {
    try {
      const { error } = await supabase.from("invoices").select("id").limit(1)
      if (error && error.message.includes("does not exist")) {
        setTableExists(false)
        setError("A tabela de faturas não existe. Execute o script SQL primeiro.")
      } else {
        setTableExists(true)
        setError(null)
      }
    } catch (err) {
      console.error("Erro ao verificar tabela:", err)
      setTableExists(false)
      setError("Erro ao verificar se a tabela existe")
    }
  }

  const loadStudents = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from("students")
        .select("id, name, email, phone, monthly_fee_type, monthly_fee_amount")
        .eq("user_id", user.id)
        .eq("status", "active") // Apenas alunos ativos
        .order("name")

      if (error) throw error
      setStudents(data || [])
    } catch (error) {
      console.error("Erro ao carregar alunos:", error)
      setError("Erro ao carregar alunos")
    }
  }

  const loadInvoices = async () => {
    if (!user || !tableExists) return

    const monthRef = getMonthReference(currentMonth)
    console.log("Carregando faturas para:", monthRef)

    try {
      // Verificar se a coluna user_id existe
      const { data: testData, error: testError } = await supabase.from("invoices").select("user_id").limit(1)

      let query = supabase.from("invoices").select("*").eq("month_reference", monthRef)

      // Se a coluna user_id existe, filtrar por ela
      if (!testError) {
        query = query.eq("user_id", user.id)
      }

      const { data, error } = await query.order("due_date")

      if (error) throw error

      console.log("Faturas carregadas:", data?.length || 0)
      setInvoices(data || [])
      setError(null)
    } catch (error) {
      console.error("Erro ao carregar faturas:", error)
      setError("Erro ao carregar faturas: " + (error as any).message)
    }
  }

  const generateMonthlyInvoices = async () => {
    if (!user || !tableExists) return

    setIsGeneratingInvoices(true)
    const monthRef = getMonthReference(currentMonth)

    try {
      // Carregar alunos ativos diretamente (não usar estado)
      const { data: activeStudents, error: studentsError } = await supabase
        .from("students")
        .select("id, name, email, phone, monthly_fee_type, monthly_fee_amount")
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("name")

      if (studentsError) {
        console.error("Erro ao carregar alunos:", studentsError)
        toast({
          title: "Erro ao carregar alunos",
          description: "Não foi possível carregar a lista de alunos.",
          variant: "destructive",
        })
        setIsGeneratingInvoices(false)
        return
      }

      const currentStudents = activeStudents || []

      if (currentStudents.length === 0) {
        toast({
          title: "Nenhum aluno ativo",
          description: "Não há alunos ativos para gerar faturas.",
          variant: "destructive",
        })
        setIsGeneratingInvoices(false)
        return
      }

      // Verificar quais alunos já têm faturas para este mês
      let existingQuery = supabase.from("invoices").select("student_id, student_name").eq("month_reference", monthRef)

      // Verificar se a coluna user_id existe
      const { error: testError } = await supabase.from("invoices").select("user_id").limit(1)

      if (!testError) {
        existingQuery = existingQuery.eq("user_id", user.id)
      }

      const { data: existingInvoices, error: existingError } = await existingQuery

      if (existingError) {
        console.error("Erro ao verificar faturas existentes:", existingError)
      }

      // Criar um Set com os IDs dos alunos que já têm faturas
      const studentsWithInvoices = new Set(
        (existingInvoices || []).map(invoice => invoice.student_id)
      )

      // Filtrar apenas alunos que ainda não têm faturas para este mês
      const studentsNeedingInvoices = currentStudents.filter(
        (student) => 
          student.monthly_fee_amount && 
          student.monthly_fee_amount > 0 && 
          !studentsWithInvoices.has(student.id)
      )

      if (studentsNeedingInvoices.length === 0) {
        const totalStudentsWithFees = currentStudents.filter(
          (student) => student.monthly_fee_amount && student.monthly_fee_amount > 0
        ).length
        
        if (totalStudentsWithFees === 0) {
          toast({
            title: "Nenhuma fatura para gerar",
            description: "Não há alunos com valores de mensalidade configurados.",
            variant: "destructive",
          })
        } else {
          toast({
            title: "Faturas já existem",
            description: `Todos os alunos já possuem faturas para ${monthNames[currentMonth.getMonth()]}/${currentMonth.getFullYear()}.`,
            variant: "destructive",
          })
        }
        setIsGeneratingInvoices(false)
        return
      }

      // Gerar faturas apenas para alunos que ainda não têm faturas
      const invoicesToCreate = studentsNeedingInvoices.map((student) => {
        const invoice: any = {
          student_id: student.id,
          student_name: student.name,
          amount: student.monthly_fee_amount || 0,
          due_date: new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 10).toISOString().split("T")[0],
          status: "pending" as const,
          month_reference: monthRef,
        }

        // Adicionar user_id se a coluna existir
        if (!testError) {
          invoice.user_id = user.id
        }

        return invoice
      })

      const { error } = await supabase.from("invoices").insert(invoicesToCreate)

      if (error) throw error

      // Recarregar faturas e alunos após inserção
      await Promise.all([loadInvoices(), loadStudents()])

      const totalExistingInvoices = (existingInvoices || []).length
      const newInvoicesCount = invoicesToCreate.length
      const totalInvoices = totalExistingInvoices + newInvoicesCount

      toast({
        title: "Faturas geradas com sucesso!",
        description: totalExistingInvoices > 0 
          ? `${newInvoicesCount} nova(s) fatura(s) adicionada(s). Total: ${totalInvoices} faturas para ${monthNames[currentMonth.getMonth()]}/${currentMonth.getFullYear()}`
          : `${newInvoicesCount} faturas foram geradas para ${monthNames[currentMonth.getMonth()]}/${currentMonth.getFullYear()}`,
      })
      setError(null)
    } catch (error) {
      console.error("Erro ao gerar faturas:", error)
      setError("Erro ao gerar faturas: " + (error as any).message)
      toast({
        title: "Erro ao gerar faturas",
        description: (error as any).message || "Ocorreu um erro ao gerar as faturas.",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingInvoices(false)
    }
  }

  const updateInvoiceStatus = async (invoiceId: string, status: "pending" | "paid" | "overdue") => {
    try {
      const { error } = await supabase.from("invoices").update({ status }).eq("id", invoiceId)

      if (error) throw error
      await loadInvoices()
      toast({
        title: "Status atualizado",
        description: `A fatura foi marcada como ${status === "paid" ? "paga" : status === "overdue" ? "em atraso" : "pendente"}.`,
      })
      setError(null)
    } catch (error) {
      console.error("Erro ao atualizar status:", error)
      setError("Erro ao atualizar status")
      toast({
        title: "Erro ao atualizar status",
        description: "Não foi possível atualizar o status da fatura.",
        variant: "destructive",
      })
    }
  }

  const deleteInvoice = async (invoiceId: string) => {
    if (!invoiceId) return

    setIsDeletingInvoice(true)
    try {
      const { error } = await supabase.from("invoices").delete().eq("id", invoiceId)

      if (error) throw error

      toast({
        title: "Fatura excluída",
        description: "A fatura foi excluída com sucesso.",
      })

      await loadInvoices()
      setDeleteDialogOpen(false)
      setInvoiceToDelete(null)
    } catch (error) {
      console.error("Erro ao excluir fatura:", error)
      toast({
        title: "Erro ao excluir fatura",
        description: "Não foi possível excluir a fatura.",
        variant: "destructive",
      })
    } finally {
      setIsDeletingInvoice(false)
    }
  }

  const deleteAllInvoicesForMonth = async () => {
    if (!user || !tableExists) return

    setIsDeletingAllInvoices(true)
    const monthRef = getMonthReference(currentMonth)

    try {
      let query = supabase.from("invoices").delete().eq("month_reference", monthRef)

      // Verificar se a coluna user_id existe
      const { error: testError } = await supabase.from("invoices").select("user_id").limit(1)
      if (!testError) {
        query = query.eq("user_id", user.id)
      }

      const { error } = await query

      if (error) throw error

      toast({
        title: "Faturas excluídas",
        description: `Todas as faturas de ${monthNames[currentMonth.getMonth()]}/${currentMonth.getFullYear()} foram excluídas.`,
      })

      await loadInvoices()
      setDeleteAllDialogOpen(false)
    } catch (error) {
      console.error("Erro ao excluir faturas:", error)
      toast({
        title: "Erro ao excluir faturas",
        description: "Não foi possível excluir as faturas.",
        variant: "destructive",
      })
    } finally {
      setIsDeletingAllInvoices(false)
    }
  }

  const sendWhatsAppMessage = (phone: string, studentName: string, amount: number, dueDate: string) => {
    // Limpar o telefone (remover caracteres especiais)
    const cleanPhone = phone.replace(/\D/g, "")

    // Garantir que o telefone tenha o código do país (55 para Brasil)
    const formattedPhone = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`

    // Criar mensagem de cobrança
    const message = `Olá ${studentName}! 

Espero que esteja bem! 🎾

Este é um lembrete sobre sua mensalidade de tênis:
💰 Valor: ${formatCurrency(amount)}
📅 Vencimento: ${new Date(dueDate).toLocaleDateString("pt-BR")}

Para manter suas aulas em dia, por favor efetue o pagamento até a data de vencimento.

Qualquer dúvida, estou à disposição!

Obrigado! 😊`

    // Codificar a mensagem para URL
    const encodedMessage = encodeURIComponent(message)

    // Criar URL do WhatsApp
    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodedMessage}`

    // Abrir WhatsApp
    window.open(whatsappUrl, "_blank")
  }

  const getStudentPhone = (studentName: string) => {
    const student = students.find((s) => s.name === studentName)
    return student?.phone || ""
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800"
      case "overdue":
        return "bg-red-100 text-red-800"
      default:
        return "bg-yellow-100 text-yellow-800"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "paid":
        return "Pago"
      case "overdue":
        return "Em Atraso"
      default:
        return "Pendente"
    }
  }

  const calculateTotals = () => {
    const total = invoices.reduce((sum, invoice) => sum + invoice.amount, 0)
    const paid = invoices.filter((inv) => inv.status === "paid").reduce((sum, invoice) => sum + invoice.amount, 0)
    const pending = invoices.filter((inv) => inv.status === "pending").reduce((sum, invoice) => sum + invoice.amount, 0)
    const overdue = invoices.filter((inv) => inv.status === "overdue").reduce((sum, invoice) => sum + invoice.amount, 0)

    return { total, paid, pending, overdue }
  }

  // Carregar dados iniciais
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true)
      await checkTableExists()
      if (user) {
        await loadStudents()
      }
      setLoading(false)
    }

    loadInitialData()
  }, [user])

  // Carregar faturas quando o mês mudar
  useEffect(() => {
    if (user && tableExists) {
      loadInvoices()
    }
  }, [currentMonth, user, tableExists])

  const totals = calculateTotals()

  if (!user) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-lg">Faça login para acessar o financeiro</div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-lg">Carregando...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-green-800 dark:text-green-400">Gestão Financeira</h1>
      <p className="text-green-600 dark:text-green-500 mt-2">Controle de mensalidades e pagamentos</p>
          </div>
        </div>

        <Card className="border-red-200">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
            <h3 className="text-lg font-medium text-red-900 dark:text-red-400 mb-2">Erro no Sistema Financeiro</h3>
        <p className="text-red-600 dark:text-red-400 text-center mb-4">{error}</p>
            <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">
              <p className="font-medium mb-2">Para resolver:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>
                  Execute o script SQL: <code>create-invoices-table-safe.sql</code>
                </li>
                <li>Recarregue a página</li>
                <li>Cadastre alunos com valores de mensalidade</li>
                <li>Gere as faturas do mês</li>
              </ol>
            </div>
            <Button onClick={() => window.location.reload()} className="mt-4" variant="outline">
              Recarregar Página
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-green-800 dark:text-green-400">Gestão Financeira</h1>
        <p className="text-green-600 dark:text-green-500 mt-2">Controle de mensalidades e pagamentos</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={generateMonthlyInvoices}
            disabled={isGeneratingInvoices || students.length === 0}
            className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600"
          >
            <FileText className="w-4 h-4 mr-2" />
            {isGeneratingInvoices ? "Gerando..." : "Gerar Faturas"}
          </Button>

          {invoices.length > 0 && (
            <Button
              onClick={() => setDeleteAllDialogOpen(true)}
              variant="outline"
              className="border-red-200 text-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Apagar Todas
            </Button>
          )}
        </div>
      </div>

      {/* Month Navigation */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={() => navigateMonth("prev")}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="text-center">
              <h2 className="text-xl font-semibold">
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </h2>
              <p className="text-sm text-gray-500">
                Referência: {getMonthReference(currentMonth)} • {invoices.length} fatura(s)
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigateMonth("next")}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totals.total)}</div>
            <p className="text-xs text-muted-foreground">{invoices.length} fatura(s)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recebido</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totals.paid)}</div>
            <p className="text-xs text-muted-foreground">Pagamentos confirmados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <DollarSign className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totals.pending)}</div>
            <p className="text-xs text-muted-foreground">Aguardando pagamento</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Atraso</CardTitle>
            <DollarSign className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totals.overdue)}</div>
            <p className="text-xs text-muted-foreground">Pagamentos atrasados</p>
          </CardContent>
        </Card>
      </div>

      {/* Invoices List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Faturas do Mês
          </CardTitle>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Nenhuma fatura encontrada</h3>
              <p className="text-gray-500 mb-4">
                {students.length === 0
                  ? "Cadastre alunos primeiro para poder gerar faturas."
                  : "Clique em 'Gerar Faturas' para criar as cobranças deste mês."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {invoices.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div>
                        <h4 className="font-medium">{invoice.student_name}</h4>
                        <p className="text-sm text-gray-500">
                          Vencimento: {new Date(invoice.due_date).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-semibold">{formatCurrency(invoice.amount)}</div>
                      <Badge className={getStatusColor(invoice.status)}>{getStatusText(invoice.status)}</Badge>
                    </div>

                    <div className="flex gap-2">
                      {/* Botão WhatsApp */}
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-green-600 hover:bg-green-50 bg-transparent"
                        onClick={() =>
                          sendWhatsAppMessage(
                            getStudentPhone(invoice.student_name),
                            invoice.student_name,
                            invoice.amount,
                            invoice.due_date,
                          )
                        }
                        disabled={!getStudentPhone(invoice.student_name)}
                        title={
                          !getStudentPhone(invoice.student_name)
                            ? "Telefone não cadastrado"
                            : "Enviar cobrança via WhatsApp"
                        }
                      >
                        <MessageCircle className="w-4 h-4" />
                      </Button>

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setSelectedInvoice(invoice)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Detalhes da Fatura</DialogTitle>
                          </DialogHeader>
                          {selectedInvoice && (
                            <div className="space-y-4">
                              <div>
                                <Label>Aluno</Label>
                                <div className="font-medium">{selectedInvoice.student_name}</div>
                              </div>
                              <div>
                                <Label>Valor</Label>
                                <div className="font-medium">{formatCurrency(selectedInvoice.amount)}</div>
                              </div>
                              <div>
                                <Label>Vencimento</Label>
                                <div>{new Date(selectedInvoice.due_date).toLocaleDateString("pt-BR")}</div>
                              </div>
                              <div>
                                <Label>Status</Label>
                                <Select
                                  value={selectedInvoice.status}
                                  onValueChange={(value) => updateInvoiceStatus(selectedInvoice.id, value as any)}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="pending">Pendente</SelectItem>
                                    <SelectItem value="paid">Pago</SelectItem>
                                    <SelectItem value="overdue">Em Atraso</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>

                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:bg-red-50 bg-transparent"
                        onClick={() => {
                          setInvoiceToDelete(invoice.id)
                          setDeleteDialogOpen(true)
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Invoice Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Fatura</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir esta fatura? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false)
                setInvoiceToDelete(null)
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => invoiceToDelete && deleteInvoice(invoiceToDelete)}
              disabled={isDeletingInvoice}
            >
              {isDeletingInvoice ? "Excluindo..." : "Excluir Fatura"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete All Invoices Dialog */}
      <Dialog open={deleteAllDialogOpen} onOpenChange={setDeleteAllDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Todas as Faturas</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir todas as faturas de {monthNames[currentMonth.getMonth()]}/
              {currentMonth.getFullYear()}? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteAllDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={deleteAllInvoicesForMonth} disabled={isDeletingAllInvoices}>
              {isDeletingAllInvoices ? "Excluindo..." : "Excluir Todas as Faturas"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
