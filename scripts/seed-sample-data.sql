-- Sample data for testing (optional)
-- This script adds sample data to test the application

-- Note: Replace 'your-user-id-here' with your actual user ID from auth.users
-- You can get your user ID by running: SELECT id FROM auth.users WHERE email = 'your-email@example.com';

-- Sample students (uncomment and replace user_id when ready to use)
/*
INSERT INTO students (name, email, phone, badge_color, badge_description, user_id) VALUES
('João Silva', 'joao@email.com', '(11) 99999-1111', 'red', 'Bola Vermelha', 'your-user-id-here'),
('Maria Santos', 'maria@email.com', '(11) 99999-2222', 'orange', 'Bola Laranja', 'your-user-id-here'),
('Pedro Costa', 'pedro@email.com', '(11) 99999-3333', 'green', 'Bola Verde', 'your-user-id-here'),
('Ana Oliveira', 'ana@email.com', '(11) 99999-4444', 'yellow', 'Bola Amarela', 'your-user-id-here');

-- Sample classes
INSERT INTO classes (name, schedule, days, level, observations, user_id) VALUES
('Turma Iniciante Manhã', '08:00 - 09:00', ARRAY['monday', 'wednesday', 'friday'], 'Iniciante', 'Turma para iniciantes no período da manhã', 'your-user-id-here'),
('Turma Intermediário Tarde', '14:00 - 15:00', ARRAY['tuesday', 'thursday'], 'Intermediário', 'Foco em técnicas intermediárias', 'your-user-id-here'),
('Turma Avançado', '18:00 - 19:00', ARRAY['monday', 'wednesday'], 'Avançado', 'Preparação para competições', 'your-user-id-here');

-- Sample materials
INSERT INTO materials (name, quantity, price, purchase_date, user_id) VALUES
('Bolas de Tênis Wilson', 50, 15.90, '2024-01-15', 'your-user-id-here'),
('Raquete Head Speed', 5, 299.90, '2024-01-10', 'your-user-id-here'),
('Cones de Treinamento', 20, 2.50, '2024-01-20', 'your-user-id-here'),
('Rede Portátil', 2, 89.90, '2024-01-05', 'your-user-id-here');
*/
