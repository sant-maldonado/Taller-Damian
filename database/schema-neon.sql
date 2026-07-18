-- Taller Mecánico - Database Schema for Neon (PostgreSQL)
-- Versión: 2.0

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- ROLES Y PERMISOS
-- =============================================

-- Roles del sistema
CREATE TABLE roles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Permisos disponibles
CREATE TABLE permissions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  module TEXT NOT NULL, -- clients, vehicles, orders, invoices, reports, hours, users, settings
  action TEXT NOT NULL, -- create, read, update, delete
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Relación roles-permisos
CREATE TABLE role_permissions (
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- =============================================
-- USUARIOS
-- =============================================

CREATE TABLE users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role_id UUID REFERENCES roles(id) ON DELETE SET NULL,
  phone TEXT,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- TABLAS DEL NEGOCIO
-- =============================================

CREATE TABLE clients (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  dni TEXT UNIQUE NOT NULL,
  address TEXT,
  notes TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE vehicles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  plate TEXT UNIQUE NOT NULL,
  color TEXT,
  vin TEXT,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE service_catalog (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  default_price DECIMAL(10, 2),
  category TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
  description TEXT,
  mileage INTEGER,
  next_service_date DATE,
  next_service_km INTEGER,
  notes TEXT,
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE order_services (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  service_catalog_id UUID REFERENCES service_catalog(id),
  name TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE invoices (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE UNIQUE NOT NULL,
  invoice_number SERIAL,
  total DECIMAL(10, 2) NOT NULL,
  pdf_url TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE hours_tracking (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  description TEXT,
  hours DECIMAL(5, 2) NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE photos (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  caption TEXT,
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- ÍNDICES
-- =============================================

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role_id ON users(role_id);
CREATE INDEX idx_clients_dni ON clients(dni);
CREATE INDEX idx_vehicles_client_id ON vehicles(client_id);
CREATE INDEX idx_vehicles_plate ON vehicles(plate);
CREATE INDEX idx_orders_vehicle_id ON orders(vehicle_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_assigned_to ON orders(assigned_to);
CREATE INDEX idx_order_services_order_id ON order_services(order_id);
CREATE INDEX idx_invoices_order_id ON invoices(order_id);
CREATE INDEX idx_hours_tracking_user_id ON hours_tracking(user_id);
CREATE INDEX idx_hours_tracking_order_id ON hours_tracking(order_id);
CREATE INDEX idx_hours_tracking_date ON hours_tracking(date);
CREATE INDEX idx_role_permissions_role_id ON role_permissions(role_id);

-- =============================================
-- ROLES POR DEFECTO
-- =============================================

-- Admin: acceso total
INSERT INTO roles (name, description) VALUES
  ('admin', 'Administrador completo del sistema'),
  ('manager', 'Gerente - gestión de órdenes, clientes, facturas'),
  ('mechanic', 'Mecánico - ver órdenes, registrar horas, fotos'),
  ('viewer', 'Solo lectura - consultar información');

-- Permisos por módulo
INSERT INTO permissions (name, description, module, action) VALUES
  -- Clients
  ('clients.create', 'Crear clientes', 'clients', 'create'),
  ('clients.read', 'Ver clientes', 'clients', 'read'),
  ('clients.update', 'Editar clientes', 'clients', 'update'),
  ('clients.delete', 'Eliminar clientes', 'clients', 'delete'),
  -- Vehicles
  ('vehicles.create', 'Crear vehículos', 'vehicles', 'create'),
  ('vehicles.read', 'Ver vehículos', 'vehicles', 'read'),
  ('vehicles.update', 'Editar vehículos', 'vehicles', 'update'),
  ('vehicles.delete', 'Eliminar vehículos', 'vehicles', 'delete'),
  -- Orders
  ('orders.create', 'Crear órdenes', 'orders', 'create'),
  ('orders.read', 'Ver órdenes', 'orders', 'read'),
  ('orders.update', 'Editar órdenes', 'orders', 'update'),
  ('orders.delete', 'Eliminar órdenes', 'orders', 'delete'),
  -- Invoices
  ('invoices.create', 'Crear facturas', 'invoices', 'create'),
  ('invoices.read', 'Ver facturas', 'invoices', 'read'),
  ('invoices.update', 'Editar facturas', 'invoices', 'update'),
  ('invoices.delete', 'Eliminar facturas', 'invoices', 'delete'),
  -- Services
  ('services.create', 'Crear servicios', 'services', 'create'),
  ('services.read', 'Ver servicios', 'services', 'read'),
  ('services.update', 'Editar servicios', 'services', 'update'),
  ('services.delete', 'Eliminar servicios', 'services', 'delete'),
  -- Hours
  ('hours.create', 'Registrar horas', 'hours', 'create'),
  ('hours.read', 'Ver horas', 'hours', 'read'),
  ('hours.update', 'Editar horas', 'hours', 'update'),
  ('hours.delete', 'Eliminar horas', 'hours', 'delete'),
  -- Reports
  ('reports.read', 'Ver reportes', 'reports', 'read'),
  ('reports.export', 'Exportar reportes', 'reports', 'export'),
  -- Users
  ('users.create', 'Crear usuarios', 'users', 'create'),
  ('users.read', 'Ver usuarios', 'users', 'read'),
  ('users.update', 'Editar usuarios', 'users', 'update'),
  ('users.delete', 'Eliminar usuarios', 'users', 'delete'),
  -- Settings
  ('settings.read', 'Ver configuración', 'settings', 'read'),
  ('settings.update', 'Editar configuración', 'settings', 'update');

-- Asignar permisos por rol

-- Admin: TODO
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p WHERE r.name = 'admin';

-- Manager: todo excepto users y settings
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'manager' AND p.name NOT LIKE 'users.%' AND p.name NOT LIKE 'settings.%';

-- Mechanic: leer todo, crear horas, fotos, órdenes
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'mechanic' AND (
  p.name LIKE '%.read'
  OR p.name IN ('hours.create', 'photos.create')
);

-- Viewer: solo lectura
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'viewer' AND p.name LIKE '%.read';

-- =============================================
-- SERVICIOS POR DEFECTO
-- =============================================

INSERT INTO service_catalog (name, description, default_price, category) VALUES
  ('Cambio de aceite', 'Cambio de aceite y filtro', 5000, 'Mantenimiento'),
  ('Cambio de distribución', 'Cambio de correa de distribución y tensores', 25000, 'Mantenimiento'),
  ('Cambio de frenos', 'Cambio de pastillas y discos de freno', 15000, 'Frenos'),
  ('Alineación y balanceo', 'Alineación de dirección y balanceo de ruedas', 8000, 'Suspensión'),
  ('Revisión general', 'Revisión general del vehículo', 10000, 'Diagnóstico'),
  ('Cambio de neumáticos', 'Cambio de neumáticos', 40000, 'Rodado'),
  ('Reparación de motor', 'Reparación general de motor', 50000, 'Motor'),
  ('Cambio de transmisión', 'Cambio o reparación de transmisión', 35000, 'Transmisión'),
  ('Servicio de aire acondicionado', 'Recarga y mantenimiento de A/C', 12000, 'Confort'),
  ('Cambio de batería', 'Cambio de batería', 20000, 'Eléctrico')
ON CONFLICT DO NOTHING;

-- =============================================
-- USUARIO ADMIN POR DEFECTO
-- =============================================

-- Password: admin123 (cambiar en producción)
INSERT INTO users (email, password_hash, name, role_id, is_active)
SELECT
  'admin@taller.com',
  crypt('admin123', gen_salt('bf')),
  'Administrador',
  r.id,
  true
FROM roles r WHERE r.name = 'admin'
ON CONFLICT (email) DO NOTHING;
