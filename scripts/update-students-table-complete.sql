-- Script para adicionar todas as colunas necessárias na tabela students
DO $$
BEGIN
    -- Adicionar birth_date se não existir
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'birth_date') THEN
        ALTER TABLE students ADD COLUMN birth_date DATE;
        RAISE NOTICE 'Coluna birth_date adicionada';
    END IF;

    -- Adicionar address se não existir
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'address') THEN
        ALTER TABLE students ADD COLUMN address TEXT;
        RAISE NOTICE 'Coluna address adicionada';
    END IF;

    -- Adicionar emergency_contact se não existir
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'emergency_contact') THEN
        ALTER TABLE students ADD COLUMN emergency_contact TEXT;
        RAISE NOTICE 'Coluna emergency_contact adicionada';
    END IF;

    -- Adicionar emergency_phone se não existir
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'emergency_phone') THEN
        ALTER TABLE students ADD COLUMN emergency_phone TEXT;
        RAISE NOTICE 'Coluna emergency_phone adicionada';
    END IF;

    -- Adicionar medical_info se não existir
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'medical_info') THEN
        ALTER TABLE students ADD COLUMN medical_info TEXT;
        RAISE NOTICE 'Coluna medical_info adicionada';
    END IF;

    -- Adicionar monthly_fee_type se não existir
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'monthly_fee_type') THEN
        ALTER TABLE students ADD COLUMN monthly_fee_type TEXT DEFAULT 'monthly';
        RAISE NOTICE 'Coluna monthly_fee_type adicionada';
    END IF;

    -- Adicionar monthly_fee_amount se não existir
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'monthly_fee_amount') THEN
        ALTER TABLE students ADD COLUMN monthly_fee_amount DECIMAL(10,2);
        RAISE NOTICE 'Coluna monthly_fee_amount adicionada';
    END IF;

    -- Adicionar payment_day se não existir
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'payment_day') THEN
        ALTER TABLE students ADD COLUMN payment_day INTEGER DEFAULT 5;
        RAISE NOTICE 'Coluna payment_day adicionada';
    END IF;

    -- Adicionar discount_percentage se não existir
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'discount_percentage') THEN
        ALTER TABLE students ADD COLUMN discount_percentage DECIMAL(5,2) DEFAULT 0;
        RAISE NOTICE 'Coluna discount_percentage adicionada';
    END IF;

    -- Adicionar notes se não existir
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'notes') THEN
        ALTER TABLE students ADD COLUMN notes TEXT;
        RAISE NOTICE 'Coluna notes adicionada';
    END IF;

    -- Adicionar documents se não existir
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'documents') THEN
        ALTER TABLE students ADD COLUMN documents JSONB DEFAULT '[]'::jsonb;
        RAISE NOTICE 'Coluna documents adicionada';
    END IF;

    -- Adicionar status se não existir
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'status') THEN
        ALTER TABLE students ADD COLUMN status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'trial'));
        RAISE NOTICE 'Coluna status adicionada';
    END IF;

    -- Adicionar enrollment_date se não existir
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'enrollment_date') THEN
        ALTER TABLE students ADD COLUMN enrollment_date DATE DEFAULT CURRENT_DATE;
        RAISE NOTICE 'Coluna enrollment_date adicionada';
    END IF;

    RAISE NOTICE 'Todas as colunas da tabela students foram verificadas e adicionadas se necessário';
END $$;
