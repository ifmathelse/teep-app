"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Camera, Upload, X } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"

interface ImageUploadProps {
  currentImageUrl?: string
  onImageChange: (url: string | null) => void
  fallbackText: string
}

export function ImageUpload({ currentImageUrl, onImageChange, fallbackText }: ImageUploadProps) {
  const { user } = useAuth()
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const uploadImage = async (file: File) => {
    if (!user) return

    try {
      setUploading(true)

      // Verificar se o arquivo é uma imagem
      if (!file.type.startsWith('image/')) {
        throw new Error('Por favor, selecione apenas arquivos de imagem.')
      }

      // Verificar tamanho do arquivo (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('O arquivo deve ter no máximo 5MB.')
      }

      // Criar nome único para o arquivo
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      const filePath = fileName

      // Upload do arquivo
      const { error: uploadError } = await supabase.storage
        .from('user-uploads')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        throw uploadError
      }

      // Obter URL pública
      const { data } = supabase.storage
        .from('user-uploads')
        .getPublicUrl(filePath)

      onImageChange(data.publicUrl)
    } catch (error) {
      console.error('Erro ao fazer upload:', error)
      alert(error instanceof Error ? error.message : 'Erro ao fazer upload da imagem')
    } finally {
      setUploading(false)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      uploadImage(file)
    }
  }

  const removeImage = () => {
    onImageChange(null)
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative">
        <Avatar className="h-24 w-24">
          <AvatarImage src={currentImageUrl || "/placeholder.svg"} />
          <AvatarFallback className="bg-green-600 text-white text-lg">
            {fallbackText}
          </AvatarFallback>
        </Avatar>
        
        {currentImageUrl && (
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
            onClick={removeImage}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600" />
          ) : (
            <>
              <Camera className="h-4 w-4 mr-2" />
              {currentImageUrl ? 'Alterar' : 'Adicionar'} Foto
            </>
          )}
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  )
}