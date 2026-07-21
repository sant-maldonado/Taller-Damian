-- Seed: Usuarios admin y clientes
-- Todos con contraseña: workshop2026

-- =============================================
-- USUARIOS ADMIN (rol: admin)
-- =============================================

INSERT INTO users (email, password_hash, name, role_id, phone, is_active)
SELECT
  'admin2@taller.com',
  crypt('workshop2026', gen_salt('bf')),
  'Carlos Admin',
  r.id,
  '+54 11 5555-0001',
  true
FROM roles r WHERE r.name = 'admin'
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (email, password_hash, name, role_id, phone, is_active)
SELECT
  'admin3@taller.com',
  crypt('workshop2026', gen_salt('bf')),
  'María Admin',
  r.id,
  '+54 11 5555-0002',
  true
FROM roles r WHERE r.name = 'admin'
ON CONFLICT (email) DO NOTHING;

-- =============================================
-- USUARIOS GERENTES (rol: manager)
-- =============================================

INSERT INTO users (email, password_hash, name, role_id, phone, is_active)
SELECT
  'gerente1@taller.com',
  crypt('workshop2026', gen_salt('bf')),
  'Roberto Gerente',
  r.id,
  '+54 11 5555-0010',
  true
FROM roles r WHERE r.name = 'manager'
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (email, password_hash, name, role_id, phone, is_active)
SELECT
  'gerente2@taller.com',
  crypt('workshop2026', gen_salt('bf')),
  'Laura Gerente',
  r.id,
  '+54 11 5555-0011',
  true
FROM roles r WHERE r.name = 'manager'
ON CONFLICT (email) DO NOTHING;

-- =============================================
-- USUARIOS MECÁNICOS (rol: mechanic)
-- =============================================

INSERT INTO users (email, password_hash, name, role_id, phone, is_active)
SELECT
  'mecanico1@taller.com',
  crypt('workshop2026', gen_salt('bf')),
  'Juan Mecánico',
  r.id,
  '+54 11 5555-0020',
  true
FROM roles r WHERE r.name = 'mechanic'
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (email, password_hash, name, role_id, phone, is_active)
SELECT
  'mecanico2@taller.com',
  crypt('workshop2026', gen_salt('bf')),
  'Pedro Mecánico',
  r.id,
  '+54 11 5555-0021',
  true
FROM roles r WHERE r.name = 'mechanic'
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (email, password_hash, name, role_id, phone, is_active)
SELECT
  'mecanico3@taller.com',
  crypt('workshop2026', gen_salt('bf')),
  'Diego Mecánico',
  r.id,
  '+54 11 5555-0022',
  true
FROM roles r WHERE r.name = 'mechanic'
ON CONFLICT (email) DO NOTHING;

-- =============================================
-- USUARIOS SOLO LECTURA (rol: viewer)
-- =============================================

INSERT INTO users (email, password_hash, name, role_id, phone, is_active)
SELECT
  'viewer1@taller.com',
  crypt('workshop2026', gen_salt('bf')),
  'Ana Viewer',
  r.id,
  '+54 11 5555-0030',
  true
FROM roles r WHERE r.name = 'viewer'
ON CONFLICT (email) DO NOTHING;

-- =============================================
-- VERIFICACIÓN
-- =============================================

SELECT u.name, u.email, r.name as role, u.is_active
FROM users u
JOIN roles r ON r.id = u.role_id
ORDER BY r.name, u.name;