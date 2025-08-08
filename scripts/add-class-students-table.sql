-- Criar tabela para relacionar alunos com turmas
CREATE TABLE IF NOT EXISTS class_students (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE NOT NULL,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    UNIQUE(class_id, student_id)
);

-- Habilitar Row Level Security
ALTER TABLE class_students ENABLE ROW LEVEL SECURITY;

-- Criar política RLS
CREATE POLICY "Users can manage their own class students" ON class_students
    FOR ALL USING (auth.uid() = user_id);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_class_students_class_id ON class_students(class_id);
CREATE INDEX IF NOT EXISTS idx_class_students_student_id ON class_students(student_id);
CREATE INDEX IF NOT EXISTS idx_class_students_user_id ON class_students(user_id);
