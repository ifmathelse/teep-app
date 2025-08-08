-- Script para corrigir as políticas de storage e resolver o erro de RLS
-- Execute este script no SQL Editor do Supabase

-- Primeiro, vamos garantir que o bucket existe
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-uploads', 'user-uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Remover todas as políticas existentes para começar do zero
DROP POLICY IF EXISTS "Users can upload their own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public access" ON storage.objects;

-- Política simples: permitir que usuários autenticados façam upload
CREATE POLICY "Allow authenticated uploads" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'user-uploads' AND 
  auth.role() = 'authenticated'
);

-- Política simples: permitir acesso público para leitura
CREATE POLICY "Allow public access" ON storage.objects
FOR SELECT USING (
  bucket_id = 'user-uploads'
);

-- Política para permitir que usuários autenticados atualizem arquivos
CREATE POLICY "Allow authenticated updates" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'user-uploads' AND 
  auth.role() = 'authenticated'
);

-- Política para permitir que usuários autenticados deletem arquivos
CREATE POLICY "Allow authenticated deletes" ON storage.objects
FOR DELETE USING (
  bucket_id = 'user-uploads' AND 
  auth.role() = 'authenticated'
);

-- Políticas de storage corrigidas com sucesso!
-- Agora você deve conseguir fazer upload de imagens.