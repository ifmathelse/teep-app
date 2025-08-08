-- Verificar se a tabela invoices existe, se não, criar
DO $$
BEGIN
    -- Criar tabela se não existir
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'invoices') THEN
        CREATE TABLE invoices (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            student_id UUID,
            student_name TEXT NOT NULL,
            amount DECIMAL(10,2) NOT NULL DEFAULT 0,
            due_date DATE NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue')),
            month_reference TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        RAISE NOTICE 'Tabela invoices criada com sucesso';
    END IF;

    -- Adicionar coluna user_id se não existir
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'user_id') THEN
        ALTER TABLE invoices ADD COLUMN user_id UUID;
        RAISE NOTICE 'Coluna user_id adicionada à tabela invoices';
    END IF;

    -- Adicionar foreign key constraints se não existirem
    IF NOT EXISTS (SELECT FROM information_schema.table_constraints WHERE constraint_name = 'invoices_student_id_fkey') THEN
        ALTER TABLE invoices ADD CONSTRAINT invoices_student_id_fkey 
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE;
        RAISE NOTICE 'Foreign key para students adicionada';
    END IF;

    -- Criar índices se não existirem
    IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_invoices_student_id') THEN
        CREATE INDEX idx_invoices_student_id ON invoices(student_id);
    END IF;

    IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_invoices_month_reference') THEN
        CREATE INDEX idx_invoices_month_reference ON invoices(month_reference);
    END IF;

    IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_invoices_status') THEN
        CREATE INDEX idx_invoices_status ON invoices(status);
    END IF;

    IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_invoices_due_date') THEN
        CREATE INDEX idx_invoices_due_date ON invoices(due_date);
    END IF;

    IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_invoices_user_id') THEN
        CREATE INDEX idx_invoices_user_id ON invoices(user_id);
    END IF;

END $$;

-- Criar função para atualizar updated_at se não existir
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Criar trigger se não existir
DROP TRIGGER IF EXISTS update_invoices_updated_at ON invoices;
CREATE TRIGGER update_invoices_updated_at 
    BEFORE UPDATE ON invoices 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes se existirem
DROP POLICY IF EXISTS "Users can view own invoices" ON invoices;
DROP POLICY IF EXISTS "Users can insert own invoices" ON invoices;
DROP POLICY IF EXISTS "Users can update own invoices" ON invoices;
DROP POLICY IF EXISTS "Users can delete own invoices" ON invoices;

-- Criar políticas RLS
CREATE POLICY "Users can view own invoices" ON invoices
    FOR SELECT USING (
        CASE 
            WHEN user_id IS NOT NULL THEN auth.uid() = user_id
            ELSE true
        END
    );

CREATE POLICY "Users can insert own invoices" ON invoices
    FOR INSERT WITH CHECK (
        CASE 
            WHEN user_id IS NOT NULL THEN auth.uid() = user_id
            ELSE true
        END
    );

CREATE POLICY "Users can update own invoices" ON invoices
    FOR UPDATE USING (
        CASE 
            WHEN user_id IS NOT NULL THEN auth.uid() = user_id
            ELSE true
        END
    );

CREATE POLICY "Users can delete own invoices" ON invoices
    FOR DELETE USING (
        CASE 
            WHEN user_id IS NOT NULL THEN auth.uid() = user_id
            ELSE true
        END
    );

-- Comentários
COMMENT ON TABLE invoices IS 'Tabela de faturas mensais dos alunos';
COMMENT ON COLUMN invoices.month_reference IS 'Referência do mês da cobrança no formato YYYY-MM';
COMMENT ON COLUMN invoices.status IS 'Status da fatura: pending, paid, overdue';
