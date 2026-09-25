-- Taller Mecánico - Database Schema for Supabase

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'EMPLOYEE' CHECK (role IN ('ADMIN', 'EMPLOYEE')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Clients table
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  dni TEXT UNIQUE NOT NULL,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vehicles table
CREATE TABLE IF NOT EXISTS public.vehicles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  plate TEXT UNIQUE NOT NULL,
  color TEXT,
  vin TEXT,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Services catalog (predefined services)
CREATE TABLE IF NOT EXISTS public.service_catalog (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  default_price DECIMAL(10, 2),
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders table
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
  description TEXT,
  mileage INTEGER,
  next_service_date DATE,
  next_service_km INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order services (services applied to an order)
CREATE TABLE IF NOT EXISTS public.order_services (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  service_catalog_id UUID REFERENCES public.service_catalog(id),
  name TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Invoices table
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE UNIQUE NOT NULL,
  invoice_number SERIAL,
  total DECIMAL(10, 2) NOT NULL,
  pdf_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Hours tracking table
CREATE TABLE IF NOT EXISTS public.hours_tracking (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  description TEXT,
  hours DECIMAL(5, 2) NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Photos table (for vehicle/order photos)
CREATE TABLE IF NOT EXISTS public.photos (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_vehicles_client_id ON public.vehicles(client_id);
CREATE INDEX IF NOT EXISTS idx_orders_vehicle_id ON public.orders(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_order_services_order_id ON public.order_services(order_id);
CREATE INDEX IF NOT EXISTS idx_hours_tracking_user_id ON public.hours_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_hours_tracking_order_id ON public.hours_tracking(order_id);

-- RLS (Row Level Security) policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hours_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;

-- Policies for authenticated users
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Authenticated users can view clients" ON public.clients
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert clients" ON public.clients
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update clients" ON public.clients
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete clients" ON public.clients
  FOR DELETE USING (auth.role() = 'authenticated');

-- Similar policies for other tables...
CREATE POLICY "Authenticated users can view vehicles" ON public.vehicles
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert vehicles" ON public.vehicles
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update vehicles" ON public.vehicles
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete vehicles" ON public.vehicles
  FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view service catalog" ON public.service_catalog
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage service catalog" ON public.service_catalog
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view orders" ON public.orders
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert orders" ON public.orders
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update orders" ON public.orders
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete orders" ON public.orders
  FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view order services" ON public.order_services
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage order services" ON public.order_services
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view invoices" ON public.invoices
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert invoices" ON public.invoices
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view hours tracking" ON public.hours_tracking
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert hours tracking" ON public.hours_tracking
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update hours tracking" ON public.hours_tracking
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view photos" ON public.photos
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert photos" ON public.photos
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete photos" ON public.photos
  FOR DELETE USING (auth.role() = 'authenticated');

-- Insert default services
INSERT INTO public.service_catalog (name, description, default_price, category) VALUES
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
