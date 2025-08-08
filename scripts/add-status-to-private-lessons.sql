-- Adicionar campo status à tabela private_lessons
ALTER TABLE private_lessons 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'scheduled' 
CHECK (status IN ('scheduled', 'completed', 'cancelled'));

-- Atualizar aulas existentes para status 'scheduled'
UPDATE private_lessons 
SET status = 'scheduled' 
WHERE status IS NULL;

-- Comentário: 
-- scheduled = agendada
-- completed = concluída
-- cancelled = cancelada