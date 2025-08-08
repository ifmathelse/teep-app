-- Criar tabela para relacionar alunos com turmas
CREATE TABLE IF NOT EXISTS class_students (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    class_id UUID NOT NULL,
    student_id UUID NOT NULL,
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID NOT NULL,
    UNIQUE(class_id, student_id),
    CONSTRAINT fk_class_students_class FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    CONSTRAINT fk_class_students_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    CONSTRAINT fk_class_students_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Habilitar Row Level Security
ALTER TABLE class_students ENABLE ROW LEVEL SECURITY;

-- Criar política RLS
CREATE POLICY "Users can manage their own class students" ON class_students
    FOR ALL USING (auth.uid() = user_id);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_class_students_class_id ON class_students(class_id);
CREATE INDEX IF NOT EXISTS idx_class_students_student_id ON class_students(student_id);
CREATE INDEX IF NOT EXISTS idx_class_students_user_id ON class_students(user_id);

-- Inserir dados de exemplo (opcional - descomente se quiser dados de teste)
/*
-- Exemplo de como inserir dados após criar alunos e turmas
INSERT INTO class_students (class_id, student_id, user_id) 
SELECT 
    c.id as class_id,
    s.id as student_id,
    c.user_id
FROM classes c, students s 
WHERE c.user_id = s.user_id 
LIMIT 3;
*/
