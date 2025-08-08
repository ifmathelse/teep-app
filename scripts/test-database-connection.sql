-- Script de teste para verificar conectividade e estrutura do banco
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar se as tabelas existem
SELECT table_name, table_schema 
FROM information_schema.tables 
WHERE table_name IN ('students', 'classes', 'private_lessons', 'materials', 'payments')
AND table_schema = 'public';

-- 2. Verificar estrutura da tabela students
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'students' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Verificar se RLS está ativo
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('students', 'classes', 'private_lessons', 'materials', 'payments');

-- 4. Verificar políticas RLS
SELECT schemaname, tablename, policyname, cmd, qual
FROM pg_policies
WHERE tablename IN ('students', 'classes', 'private_lessons', 'materials', 'payments');

-- 5. Testar autenticação (deve retornar o UUID do usuário logado)
SELECT auth.uid() as current_user_id;

-- 6. Testar consulta simples na tabela students
SELECT COUNT(*) as total_students FROM students;

-- 7. Testar consulta com filtro de usuário
SELECT COUNT(*) as my_students FROM students WHERE user_id = auth.uid();

-- 8. Se as tabelas não existirem, este comando falhará
-- Descomente para testar inserção:
-- INSERT INTO students (name, email, phone, badge_color, badge_description, user_id)
-- VALUES ('Teste DB', 'teste@db.com', '123456789', 'blue', 'Teste Conexão', auth.uid());

-- 9. Verificar se há dados de exemplo
SELECT 'Contagem de registros' as info,
       (SELECT COUNT(*) FROM students) as students_count,
       (SELECT COUNT(*) FROM classes) as classes_count,
       (SELECT COUNT(*) FROM private_lessons) as lessons_count,
       (SELECT COUNT(*) FROM materials) as materials_count,
       (SELECT COUNT(*) FROM payments) as payments_count;