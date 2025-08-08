-- Desabilitar confirmação de email temporariamente para desenvolvimento
UPDATE auth.users SET email_confirmed_at = NOW() WHERE email_confirmed_at IS NULL;

-- Configurar Supabase para não exigir confirmação de email (apenas para desenvolvimento)
-- Isso deve ser feito no painel do Supabase em Authentication > Settings
-- Desmarque "Enable email confirmations"
