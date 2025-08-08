-- Script para verificar se as tabelas foram criadas corretamente
-- Execute este script no SQL Editor do Supabase para diagnosticar problemas

-- Verificar se as tabelas existem
SELECT 
    schemaname,
    tablename,
    tableowner,
    hasindexes,
    hasrules,
    hastriggers
FROM pg_tables 
WHERE tablename IN ('students', 'classes', 'private_lessons', 'materials', 'payments')
ORDER BY tablename;

-- Verificar políticas RLS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('students', 'classes', 'private_lessons', 'materials', 'payments')
ORDER BY tablename, policyname;

-- Verificar se RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('students', 'classes', 'private_lessons', 'materials', 'payments')
ORDER BY tablename;

-- Testar inserção simples (remova os comentários para testar)
-- INSERT INTO students (name, email, phone, badge_color, badge_description, user_id) 
-- VALUES ('Teste', 'teste@email.com', '123456789', 'blue', 'Teste', auth.uid());

-- SELECT * FROM students WHERE user_id = auth.uid();