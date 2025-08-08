-- Adicionar novos campos à tabela de estudantes
ALTER TABLE students ADD COLUMN IF NOT EXISTS birth_date DATE;
ALTER TABLE students ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS emergency_contact VARCHAR(255);
ALTER TABLE students ADD COLUMN IF NOT EXISTS emergency_phone VARCHAR(20);
ALTER TABLE students ADD COLUMN IF NOT EXISTS medical_info TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS monthly_fee_type VARCHAR(50) DEFAULT 'monthly';
ALTER TABLE students ADD COLUMN IF NOT EXISTS monthly_fee_amount DECIMAL(10,2);
ALTER TABLE students ADD COLUMN IF NOT EXISTS payment_day INTEGER DEFAULT 5;
ALTER TABLE students ADD COLUMN IF NOT EXISTS discount_percentage DECIMAL(5,2) DEFAULT 0;
ALTER TABLE students ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS documents JSONB DEFAULT '[]';
ALTER TABLE students ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
ALTER TABLE students ADD COLUMN IF NOT EXISTS enrollment_date DATE DEFAULT CURRENT_DATE;

-- Criar índices para os novos campos
CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);
CREATE INDEX IF NOT EXISTS idx_students_monthly_fee_type ON students(monthly_fee_type);
CREATE INDEX IF NOT EXISTS idx_students_enrollment_date ON students(enrollment_date);

-- Atualizar dados existentes (opcional)
UPDATE students SET 
    monthly_fee_type = 'monthly',
    monthly_fee_amount = 150.00,
    payment_day = 5,
    status = 'active',
    enrollment_date = CURRENT_DATE
WHERE monthly_fee_type IS NULL;
