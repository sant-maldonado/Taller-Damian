-- Seed: Usuarios del sistema
-- Contraseña universal: admin123

-- =============================================
-- ADMIN (rol: admin)
-- =============================================

INSERT INTO users (email, password_hash, name, role_id, phone, is_active)
SELECT
  'admin@taller.com',
  crypt('admin123', gen_salt('bf')),
  'Administrador',
  r.id,
  '+54 11 5555-0001',
  true
FROM roles r WHERE r.name = 'admin'
ON CONFLICT (email) DO NOTHING;

-- =============================================
-- CLIENTES (rol: client) — login con DNI
-- =============================================

INSERT INTO users (email, password_hash, name, role_id, phone, is_active)
SELECT '30123456', crypt('admin123', gen_salt('bf')), 'Martín López', r.id, '+54 11 6666-0001', true
FROM roles r WHERE r.name = 'client' ON CONFLICT (email) DO NOTHING;

INSERT INTO clients (name, phone, email, dni)
SELECT 'Martín López', '+54 11 6666-0001', '30123456', '30123456'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE dni = '30123456');

INSERT INTO users (email, password_hash, name, role_id, phone, is_active)
SELECT '30234567', crypt('admin123', gen_salt('bf')), 'Lucía García', r.id, '+54 11 6666-0002', true
FROM roles r WHERE r.name = 'client' ON CONFLICT (email) DO NOTHING;

INSERT INTO clients (name, phone, email, dni)
SELECT 'Lucía García', '+54 11 6666-0002', '30234567', '30234567'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE dni = '30234567');

INSERT INTO users (email, password_hash, name, role_id, phone, is_active)
SELECT '30345678', crypt('admin123', gen_salt('bf')), 'Fernando Ruiz', r.id, '+54 11 6666-0003', true
FROM roles r WHERE r.name = 'client' ON CONFLICT (email) DO NOTHING;

INSERT INTO clients (name, phone, email, dni)
SELECT 'Fernando Ruiz', '+54 11 6666-0003', '30345678', '30345678'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE dni = '30345678');

INSERT INTO users (email, password_hash, name, role_id, phone, is_active)
SELECT '30456789', crypt('admin123', gen_salt('bf')), 'Camila Torres', r.id, '+54 11 6666-0004', true
FROM roles r WHERE r.name = 'client' ON CONFLICT (email) DO NOTHING;

INSERT INTO clients (name, phone, email, dni)
SELECT 'Camila Torres', '+54 11 6666-0004', '30456789', '30456789'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE dni = '30456789');

INSERT INTO users (email, password_hash, name, role_id, phone, is_active)
SELECT '30567890', crypt('admin123', gen_salt('bf')), 'Rodrigo Díaz', r.id, '+54 11 6666-0005', true
FROM roles r WHERE r.name = 'client' ON CONFLICT (email) DO NOTHING;

INSERT INTO clients (name, phone, email, dni)
SELECT 'Rodrigo Díaz', '+54 11 6666-0005', '30567890', '30567890'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE dni = '30567890');

-- =============================================
-- VERIFICACIÓN
-- =============================================

SELECT u.name, u.email, r.name as role, u.is_active
FROM users u
JOIN roles r ON r.id = u.role_id
ORDER BY r.name, u.name;
