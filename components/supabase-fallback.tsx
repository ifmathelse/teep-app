"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, ExternalLink } from "lucide-react"

export function SupabaseFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <AlertCircle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
          <CardTitle className="text-2xl font-bold text-green-800">Configuração Necessária</CardTitle>
          <CardDescription>O Supabase precisa ser configurado para continuar</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <h3 className="font-semibold text-orange-800 mb-2">Passos para configurar:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-orange-700">
              <li>Acesse o painel do Supabase</li>
              <li>Configure as variáveis de ambiente</li>
              <li>Execute os scripts SQL necessários</li>
            </ol>
          </div>
          <Button
            className="w-full bg-green-600 hover:bg-green-700"
            onClick={() => window.open("https://supabase.com", "_blank")}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Abrir Supabase
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export default SupabaseFallback
