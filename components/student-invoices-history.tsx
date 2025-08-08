"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MessageCircle, Calendar, DollarSign } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "@/hooks/use-toast"

interface Invoice {
  id: string
  student_id: string
  student_name: string
  amount: number
  due_date: string
  status: "pending" | "paid" | "overdue"
  month_reference: string
  created_at: string
}

interface Student {
  phone: string
  name: string
}

interface StudentInvoicesHistoryProps {
  studentId: string
}

export function StudentInvoicesHistory({ studentId }: StudentInvoicesHistoryProps) {
  const { user } = useAuth()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [student, setStudent] = useState<Student | null>(null)
  const [loading, setLoading] = useState(true)

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

  const formatMonthReference = (monthRef: string) => {
    const [year, month] = monthRef.split("-")
    const monthIndex = Number.parseInt(month) - 1
    return `${monthNames[monthIndex]}/${year}`
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

  const loadStudentData = async () => {
    if (!user || !studentId) return

    try {
      const { data, error } = await supabase
        .from("students")
        .select("phone, name")
        .eq("id", studentId)
        .eq("user_id", user.id)
        .single()

      if (error) throw error
      setStudent(data)
    } catch (error) {
      console.error("Erro ao carregar dados do aluno:", error)
    }
  }

  const loadInvoices = async () => {
    if (!user || !studentId) return

    try {
      // Verificar se a coluna user_id existe
      const { data: testData, error: testError } = await supabase.from("invoices").select("user_id").limit(1)

      let query = supabase.from("invoices").select("*").eq("student_id", studentId)

      // Se a coluna user_id existe, filtrar por ela
      if (!testError) {
        query = query.eq("user_id", user.id)
      }

      const { data, error } = await query.order("month_reference", { ascending: false })

      if (error) throw error
      setInvoices(data || [])
    } catch (error) {
      console.error("Erro ao carregar faturas:", error)
    } finally {
      setLoading(false)
    }
  }

  const updateInvoiceStatus = async (invoiceId: string, status: "pending" | "paid" | "overdue") => {
    try {
      const { error } = await supabase.from("invoices").update({ status }).eq("id", invoiceId)

      if (error) throw error

      // Atualizar o estado local
      setInvoices((prev) => prev.map((invoice) => (invoice.id === invoiceId ? { ...invoice, status } : invoice)))

      toast({
        title: "Status atualizado",
        description: `A fatura foi marcada como ${status === "paid" ? "paga" : status === "overdue" ? "em atraso" : "pendente"}.`,
      })
    } catch (error) {
      console.error("Erro ao atualizar status:", error)
      toast({
        title: "Erro ao atualizar status",
        description: "Não foi possível atualizar o status da fatura.",
        variant: "destructive",
      })
    }
  }

  const sendWhatsAppMessage = (invoice: Invoice) => {
    if (!student?.phone) {
      toast({
        title: "Telefone não cadastrado",
        description: "O aluno não possui telefone cadastrado.",
        variant: "destructive",
      })
      return
    }

    // Limpar o telefone (remover caracteres especiais)
    const cleanPhone = student.phone.replace(/\D/g, "")

    // Garantir que o telefone tenha o código do país (55 para Brasil)
    const formattedPhone = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`

    // Criar mensagem de cobrança
    const message = `Olá ${student.name}! 

Espero que esteja bem! 🎾

Este é um lembrete sobre sua mensalidade de tênis:
📅 Referência: ${formatMonthReference(invoice.month_reference)}
💰 Valor: ${formatCurrency(invoice.amount)}
📅 Vencimento: ${new Date(invoice.due_date).toLocaleDateString("pt-BR")}

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

  useEffect(() => {
    if (studentId && user) {
      loadStudentData()
      loadInvoices()
    }
  }, [studentId, user])

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-100 rounded animate-pulse"></div>
        ))}
      </div>
    )
  }

  if (invoices.length === 0) {
    return (
      <div className="text-center py-6">
        <DollarSign className="h-8 w-8 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-500 text-sm">Nenhuma fatura encontrada para este aluno</p>
      </div>
    )
  }

  return (
    <div className="space-y-3 max-h-64 overflow-y-auto">
      {invoices.map((invoice) => (
        <Card key={invoice.id} className="border-l-4 border-l-green-500">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="font-medium text-sm">{formatMonthReference(invoice.month_reference)}</span>
                  <Badge className={getStatusColor(invoice.status)}>{getStatusText(invoice.status)}</Badge>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-600">
                  <span>Valor: {formatCurrency(invoice.amount)}</span>
                  <span>Vencimento: {new Date(invoice.due_date).toLocaleDateString("pt-BR")}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Botão WhatsApp */}
                <Button
                  variant="outline"
                  size="sm"
                  className="text-green-600 hover:bg-green-50 h-8 w-8 p-0 bg-transparent"
                  onClick={() => sendWhatsAppMessage(invoice)}
                  disabled={!student?.phone}
                  title={!student?.phone ? "Telefone não cadastrado" : "Enviar cobrança via WhatsApp"}
                >
                  <MessageCircle className="w-3 h-3" />
                </Button>

                {/* Select de Status */}
                <Select value={invoice.status} onValueChange={(value) => updateInvoiceStatus(invoice.id, value as any)}>
                  <SelectTrigger className="h-8 w-24 text-xs">
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
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
