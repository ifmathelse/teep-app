-- Script para atualizar/criar a tabela user_profiles com todos os campos necessários
-- Execute este script no SQL Editor do Supabase

-- Criar tabela de perfil de usuário (se não existir)
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    full_name VARCHAR(255),
    phone VARCHAR(20),
    business_name VARCHAR(255),
    location VARCHAR(255),
    bio TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar colunas se não existirem (para casos onde a tabela já existe)
DO $$
BEGIN
    -- Verificar e adicionar full_name
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'full_name') THEN
        ALTER TABLE user_profiles ADD COLUMN full_name VARCHAR(255);
        RAISE NOTICE 'Coluna full_name adicionada';
    END IF;

    -- Verificar e adicionar phone
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'phone') THEN
        ALTER TABLE user_profiles ADD COLUMN phone VARCHAR(20);
        RAISE NOTICE 'Coluna phone adicionada';
    END IF;

    -- Verificar e adicionar business_name
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'business_name') THEN
        ALTER TABLE user_profiles ADD COLUMN business_name VARCHAR(255);
        RAISE NOTICE 'Coluna business_name adicionada';
    END IF;

    -- Verificar e adicionar location
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'location') THEN
        ALTER TABLE user_profiles ADD COLUMN location VARCHAR(255);
        RAISE NOTICE 'Coluna location adicionada';
    END IF;

    -- Verificar e adicionar bio
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'bio') THEN
        ALTER TABLE user_profiles ADD COLUMN bio TEXT;
        RAISE NOTICE 'Coluna bio adicionada';
    END IF;

    -- Verificar e adicionar avatar_url
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'avatar_url') THEN
        ALTER TABLE user_profiles ADD COLUMN avatar_url TEXT;
        RAISE NOTICE 'Coluna avatar_url adicionada';
    END IF;

    -- Verificar e adicionar updated_at
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'updated_at') THEN
        ALTER TABLE user_profiles ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Coluna updated_at adicionada';
    END IF;
END $$;

-- Habilitar Row Level Security para user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Criar política RLS para user_profiles (apenas se não existir)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_profiles' 
        AND policyname = 'Users can view and edit their own profile'
    ) THEN
        CREATE POLICY "Users can view and edit their own profile" ON user_profiles
            FOR ALL USING (auth.uid() = user_id);
        RAISE NOTICE 'Política RLS criada para user_profiles';
    END IF;
END $$;

-- Criar índice para user_profiles
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at automaticamente
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Função para criar perfil automaticamente quando um usuário se registra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, full_name)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remover trigger existente se houver
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Criar trigger para criar perfil automaticamente
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Criar perfis para usuários existentes que não têm perfil
INSERT INTO public.user_profiles (user_id, full_name)
SELECT 
    id, 
    COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1))
FROM auth.users 
WHERE id NOT IN (SELECT user_id FROM public.user_profiles)
ON CONFLICT (user_id) DO NOTHING;

-- Verificar se tudo foi criado corretamente
SELECT 
    'user_profiles' as table_name,
    COUNT(*) as total_profiles
FROM user_profiles;

RAISE NOTICE 'Script de atualização da tabela user_profiles executado com sucesso!';