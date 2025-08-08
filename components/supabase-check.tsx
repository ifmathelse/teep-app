"use client"

import { useEffect, useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { isSupabaseConfigured } from "@/lib/supabase"

export function SupabaseCheck() {
  const [status, setStatus] = useState<{
    configured: boolean
    connection: boolean
    loading: boolean
    error?: string
  }>({
    configured: false,
    connection: false,
    loading: true,
  })

  useEffect(() => {
    checkSupabaseConfig()
  }, [])

  const checkSupabaseConfig = async () => {
    const configured = isSupabaseConfigured()

    if (!configured) {
      setStatus({
        configured: false,
        connection: false,
        loading: false,
      })
      return
    }

    let connectionWorks = false
    let error = ""

    try {
      const { supabase } = await import("@/lib/supabase")
      const { error: dbError } = await supabase.from("students").select("count").limit(1)
      connectionWorks = !dbError
      if (dbError) {
        error = dbError.message
      }
    } catch (err) {
      connectionWorks = false
      error = err instanceof Error ? err.message : "Erro desconhecido"
    }

    setStatus({
      configured,
      connection: connectionWorks,
      loading: false,
      error: connectionWorks ? undefined : error,
    })
  }

  if (status.loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </CardContent>
      </Card>
    )
  }

  const allGood = status.configured && status.connection

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {allGood ? <CheckCircle className="h-5 w-5 text-green-600" /> : <XCircle className="h-5 w-5 text-red-600" />}
          Status da Configuração Supabase
        </CardTitle>
        <CardDescription>Verificação das configurações necessárias</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {status.configured ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <XCircle className="h-4 w-4 text-red-600" />
            )}
            <span>Variáveis de ambiente configuradas</span>
          </div>
          <div className="flex items-center gap-2">
            {status.connection ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <XCircle className="h-4 w-4 text-red-600" />
            )}
            <span>Conexão com banco de dados</span>
          </div>
        </div>

        {!status.configured && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Configuração Necessária</AlertTitle>
            <AlertDescription>
              As variáveis de ambiente do Supabase não estão configuradas. Use o botão "Add Integration" para configurar
              automaticamente.
            </AlertDescription>
          </Alert>
        )}

        {status.configured && !status.connection && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro de Conexão</AlertTitle>
            <AlertDescription>
              {status.error
                ? `Erro: ${status.error}`
                : "Não foi possível conectar ao banco de dados. Verifique se as tabelas foram criadas."}
            </AlertDescription>
          </Alert>
        )}

        {allGood && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">Configuração OK!</AlertTitle>
            <AlertDescription className="text-green-700">
              Todas as configurações do Supabase estão funcionando corretamente.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
