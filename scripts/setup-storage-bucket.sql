-- Script para configurar o bucket de storage para uploads de usuários
-- Execute este script no SQL Editor do Supabase

-- Criar bucket para uploads de usuários (se não existir)
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-uploads', 'user-uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Remover políticas existentes se houver
DROP POLICY IF EXISTS "Users can upload their own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view avatars" ON storage.objects;

-- Política para permitir que usuários autenticados façam upload de suas próprias imagens
CREATE POLICY "Users can upload their own images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'user-uploads' AND 
  auth.uid() IS NOT NULL AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Política para permitir que usuários autenticados vejam suas próprias imagens
CREATE POLICY "Users can view their own images" ON storage.objects
FOR SELECT USING (
  bucket_id = 'user-uploads' AND 
  auth.uid() IS NOT NULL AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Política para permitir que usuários autenticados atualizem suas próprias imagens
CREATE POLICY "Users can update their own images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'user-uploads' AND 
  auth.uid() IS NOT NULL AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Política para permitir que usuários autenticados deletem suas próprias imagens
CREATE POLICY "Users can delete their own images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'user-uploads' AND 
  auth.uid() IS NOT NULL AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Política para permitir visualização pública de avatares
CREATE POLICY "Public can view avatars" ON storage.objects
FOR SELECT USING (
  bucket_id = 'user-uploads' AND 
  (storage.foldername(name))[2] = 'avatars'
);

-- Bucket de storage configurado com sucesso!
-- Agora você pode fazer upload de imagens para o bucket user-uploads
-- As imagens serão organizadas por usuário: user-uploads/USER_ID/avatars/filename.ext