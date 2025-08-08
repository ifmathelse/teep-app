-- Script para criar tabelas que podem estar faltando no banco de dados
-- Execute este script no SQL Editor do Supabase

-- Criar tabela de estudantes
CREATE TABLE IF NOT EXISTS students (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    badge_color VARCHAR(50) NOT NULL,
    badge_description VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

-- Criar tabela de turmas
CREATE TABLE IF NOT EXISTS classes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    schedule VARCHAR(100) NOT NULL,
    days TEXT[] NOT NULL,
    level VARCHAR(100) NOT NULL,
    observations TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

-- Criar tabela de aulas particulares
CREATE TABLE IF NOT EXISTS private_lessons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_name VARCHAR(255) NOT NULL,
    student_id UUID REFERENCES students(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    time TIME NOT NULL,
    type VARCHAR(20) CHECK (type IN ('regular', 'makeup', 'trial')) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

-- Criar tabela de materiais
CREATE TABLE IF NOT EXISTS materials (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    purchase_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

-- Criar tabela de pagamentos
CREATE TABLE IF NOT EXISTS payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
    month VARCHAR(20) NOT NULL,
    year INTEGER NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    paid BOOLEAN DEFAULT FALSE,
    due_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

-- Habilitar Row Level Security
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE private_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes se houver
DROP POLICY IF EXISTS "Users can only see their own students" ON students;
DROP POLICY IF EXISTS "Users can only see their own classes" ON classes;
DROP POLICY IF EXISTS "Users can only see their own private lessons" ON private_lessons;
DROP POLICY IF EXISTS "Users can only see their own materials" ON materials;
DROP POLICY IF EXISTS "Users can only see their own payments" ON payments;

-- Criar políticas RLS
CREATE POLICY "Users can only see their own students" ON students
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only see their own classes" ON classes
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only see their own private lessons" ON private_lessons
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only see their own materials" ON materials
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only see their own payments" ON payments
    FOR ALL USING (auth.uid() = user_id);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_students_user_id ON students(user_id);
CREATE INDEX IF NOT EXISTS idx_classes_user_id ON classes(user_id);
CREATE INDEX IF NOT EXISTS idx_private_lessons_user_id ON private_lessons(user_id);
CREATE INDEX IF NOT EXISTS idx_materials_user_id ON materials(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);

-- Comentários informativos
-- Execute este script no SQL Editor do Supabase para criar todas as tabelas necessárias
-- Após executar, teste a aplicação para verificar se os erros de rede foram resolvidos