const DB_KEY = 'taller_mecanico_db'

function generateId() {
  return crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2)
}

function date(daysAgo) {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  d.setHours(10 + Math.floor(Math.random() * 8), Math.floor(Math.random() * 60))
  return d.toISOString()
}

export function seedAll() {
  const clients = [
    { id: 'c1', name: 'Carlos García', email: 'carlos.garcia@gmail.com', phone: '11-4567-8901', dni: '30123456', address: 'Av. San Martín 1234, CABA', created_at: date(45) },
    { id: 'c2', name: 'María López', email: 'maria.lopez@hotmail.com', phone: '11-5678-9012', dni: '27987654', address: 'Belgrano 567, Lanús', created_at: date(40) },
    { id: 'c3', name: 'Juan Pérez', email: 'juan.perez@yahoo.com', phone: '11-6789-0123', dni: '32456789', address: 'Rivadavia 890, Avellaneda', created_at: date(38) },
    { id: 'c4', name: 'Laura Martínez', email: 'laura.m@gmail.com', phone: '11-7890-1234', dni: '35234567', address: 'Mitre 456, Quilmes', created_at: date(35) },
    { id: 'c5', name: 'Roberto Sánchez', email: 'roberto.s@outlook.com', phone: '11-8901-2345', dni: '28123789', address: 'Sarmiento 234, Adrogué', created_at: date(30) },
    { id: 'c6', name: 'Ana Rodríguez', email: 'ana.r@gmail.com', phone: '11-9012-3456', dni: '36876543', address: 'Callao 678, Capital', created_at: date(28) },
    { id: 'c7', name: 'Diego Fernández', email: 'diego.f@gmail.com', phone: '11-0123-4567', dni: '33567890', address: 'Libertad 901, Lomas', created_at: date(25) },
    { id: 'c8', name: 'Silvia González', email: 'silvia.g@hotmail.com', phone: '11-1234-5678', dni: '29345678', address: 'Alsina 345, Burzaco', created_at: date(20) },
    { id: 'c9', name: 'Fernando Díaz', email: 'fernando.d@gmail.com', phone: '11-2345-6789', dni: '31678901', address: 'Independencia 123, CABA', created_at: date(15) },
    { id: 'c10', name: 'Patricia Romero', email: 'patricia.r@outlook.com', phone: '11-3456-7890', dni: '34789012', address: 'Corrientes 567, Capital', created_at: date(10) },
  ]

  const vehicles = [
    { id: 'v1', client_id: 'c1', brand: 'Toyota', model: 'Corolla', year: 2020, plate: 'ABC123', color: 'Blanco', created_at: date(44) },
    { id: 'v2', client_id: 'c1', brand: 'Ford', model: 'Ranger', year: 2018, plate: 'DEF456', color: 'Gris', created_at: date(42) },
    { id: 'v3', client_id: 'c2', brand: 'Volkswagen', model: 'Gol', year: 2019, plate: 'GHI789', color: 'Negro', created_at: date(39) },
    { id: 'v4', client_id: 'c3', brand: 'Chevrolet', model: 'Onix', year: 2021, plate: 'JKL012', color: 'Rojo', created_at: date(37) },
    { id: 'v5', client_id: 'c4', brand: 'Fiat', model: 'Cronos', year: 2022, plate: 'MNO345', color: 'Azul', created_at: date(34) },
    { id: 'v6', client_id: 'c5', brand: 'Peugeot', model: '208', year: 2020, plate: 'PQR678', color: 'Plata', created_at: date(29) },
    { id: 'v7', client_id: 'c6', brand: 'Renault', model: 'Sandero', year: 2021, plate: 'STU901', color: 'Blanco', created_at: date(27) },
    { id: 'v8', client_id: 'c7', brand: 'Toyota', model: 'Hilux', year: 2019, plate: 'VWX234', color: 'Verde', created_at: date(24) },
    { id: 'v9', client_id: 'c8', brand: 'Honda', model: 'Civic', year: 2023, plate: 'YZA567', color: 'Negro', created_at: date(19) },
    { id: 'v10', client_id: 'c9', brand: 'Nissan', model: 'Versa', year: 2022, plate: 'BCD890', color: 'Gris', created_at: date(14) },
    { id: 'v11', client_id: 'c10', brand: 'Hyundai', model: 'i10', year: 2021, plate: 'EFG123', color: 'Plateado', created_at: date(9) },
    { id: 'v12', client_id: 'c4', brand: 'Ford', model: 'EcoSport', year: 2020, plate: 'HIJ456', color: 'Rojo', created_at: date(8) },
  ]

  const services = [
    { id: 's1', name: 'Cambio de aceite', description: 'Cambio de aceite y filtro', default_price: 5000, category: 'Mantenimiento' },
    { id: 's2', name: 'Cambio de distribución', description: 'Cambio de correa de distribución y tensores', default_price: 25000, category: 'Mantenimiento' },
    { id: 's3', name: 'Cambio de frenos', description: 'Cambio de pastillas y discos de freno', default_price: 15000, category: 'Frenos' },
    { id: 's4', name: 'Alineación y balanceo', description: 'Alineación de dirección y balanceo de ruedas', default_price: 8000, category: 'Suspensión' },
    { id: 's5', name: 'Revisión general', description: 'Revisión general del vehículo', default_price: 10000, category: 'Diagnóstico' },
    { id: 's6', name: 'Cambio de neumáticos', description: 'Cambio de neumáticos', default_price: 40000, category: 'Rodado' },
    { id: 's7', name: 'Reparación de motor', description: 'Reparación general de motor', default_price: 50000, category: 'Motor' },
    { id: 's8', name: 'Cambio de transmisión', description: 'Cambio o reparación de transmisión', default_price: 35000, category: 'Transmisión' },
    { id: 's9', name: 'Servicio de aire acondicionado', description: 'Recarga y mantenimiento de A/C', default_price: 12000, category: 'Confort' },
    { id: 's10', name: 'Cambio de batería', description: 'Cambio de batería', default_price: 20000, category: 'Eléctrico' },
  ]

  const orders = [
    { id: 'o1', vehicle_id: 'v1', description: 'Service 50.000 km — cambio de aceite, filtros y revisión general', status: 'COMPLETED', created_at: date(30), completed_at: date(28) },
    { id: 'o2', vehicle_id: 'v3', description: 'Ruido extraño al frenar,pastillas desgastadas', status: 'COMPLETED', created_at: date(25), completed_at: date(22) },
    { id: 'o3', vehicle_id: 'v4', description: 'Cambio de distribución preventivo por km', status: 'IN_PROGRESS', created_at: date(10) },
    { id: 'o4', vehicle_id: 'v5', description: 'Revisión de motor — pierde agua,温度 alta', status: 'IN_PROGRESS', created_at: date(8) },
    { id: 'o5', vehicle_id: 'v2', description: 'Alineación y balanceo + cambio de neumáticos delanteros', status: 'PENDING', created_at: date(5) },
    { id: 'o6', vehicle_id: 'v7', description: 'Service 30.000 km', status: 'PENDING', created_at: date(3) },
    { id: 'o7', vehicle_id: 'v9', description: 'Cambio de batería y revisión eléctrica general', status: 'COMPLETED', created_at: date(20), completed_at: date(18) },
    { id: 'o8', vehicle_id: 'v6', description: 'Servicio de A/C — no enfría', status: 'COMPLETED', created_at: date(15), completed_at: date(12) },
    { id: 'o9', vehicle_id: 'v8', description: 'Reparación de caja de cambios', status: 'IN_PROGRESS', created_at: date(2) },
    { id: 'o10', vehicle_id: 'v10', description: 'Cambio de aceite y filtros', status: 'PENDING', created_at: date(1) },
    { id: 'o11', vehicle_id: 'v11', description: 'Revisión general pre-venta', status: 'COMPLETED', created_at: date(12), completed_at: date(10) },
    { id: 'o12', vehicle_id: 'v12', description: 'Service 20.000 km + frenos traseros', status: 'PENDING', created_at: date(0) },
  ]

  const orderServices = [
    { id: 'os1', order_id: 'o1', name: 'Cambio de aceite', price: 5000 },
    { id: 'os2', order_id: 'o1', name: 'Revisión general', price: 10000 },
    { id: 'os3', order_id: 'o2', name: 'Cambio de frenos', price: 15000 },
    { id: 'os4', order_id: 'o3', name: 'Cambio de distribución', price: 25000 },
    { id: 'os5', order_id: 'o4', name: 'Reparación de motor', price: 50000 },
    { id: 'os6', order_id: 'o5', name: 'Alineación y balanceo', price: 8000 },
    { id: 'os7', order_id: 'o5', name: 'Cambio de neumáticos', price: 40000 },
    { id: 'os8', order_id: 'o6', name: 'Cambio de aceite', price: 5000 },
    { id: 'os9', order_id: 'o6', name: 'Revisión general', price: 10000 },
    { id: 'os10', order_id: 'o7', name: 'Cambio de batería', price: 20000 },
    { id: 'os11', order_id: 'o8', name: 'Servicio de aire acondicionado', price: 12000 },
    { id: 'os12', order_id: 'o9', name: 'Cambio de transmisión', price: 35000 },
    { id: 'os13', order_id: 'o10', name: 'Cambio de aceite', price: 5000 },
    { id: 'os14', order_id: 'o11', name: 'Revisión general', price: 10000 },
    { id: 'os15', order_id: 'o12', name: 'Cambio de aceite', price: 5000 },
    { id: 'os16', order_id: 'o12', name: 'Cambio de frenos', price: 15000 },
  ]

  const invoices = [
    { id: 'i1', order_id: 'o1', invoice_number: 1, total: 15000, created_at: date(27) },
    { id: 'i2', order_id: 'o2', invoice_number: 2, total: 15000, created_at: date(21) },
    { id: 'i3', order_id: 'o7', invoice_number: 3, total: 20000, created_at: date(17) },
    { id: 'i4', order_id: 'o8', invoice_number: 4, total: 12000, created_at: date(11) },
    { id: 'i5', order_id: 'o11', invoice_number: 5, total: 10000, created_at: date(9) },
  ]

  const hoursTracking = [
    { id: 'h1', description: 'Service Corolla — desarmado y revisión', hours: 3.5, date: date(30), order_id: 'o1' },
    { id: 'h2', description: 'Service Corolla — armado y prueba', hours: 2, date: date(28), order_id: 'o1' },
    { id: 'h3', description: 'Diagnóstico frenos Gol', hours: 1, date: date(25), order_id: 'o2' },
    { id: 'h4', description: 'Cambio pastillas y discos', hours: 2.5, date: date(23), order_id: 'o2' },
    { id: 'h5', description: 'Cambio distribución Onix — desarme', hours: 4, date: date(10), order_id: 'o3' },
    { id: 'h6', description: 'Revisión A/C Sandero', hours: 1.5, date: date(15), order_id: 'o8' },
    { id: 'h7', description: 'Cambio batería Civic', hours: 0.75, date: date(20), order_id: 'o7' },
    { id: 'h8', description: 'Revisión eléctrica Civic', hours: 1.25, date: date(19), order_id: 'o7' },
    { id: 'h9', description: 'Alineación Ranger + balanceo', hours: 1.5, date: date(5), order_id: 'o5' },
    { id: 'h10', description: 'Service Hilux — preparación caja', hours: 3, date: date(2), order_id: 'o9' },
    { id: 'h11', description: 'Revisión general Versa pre-venta', hours: 2, date: date(12), order_id: 'o11' },
    { id: 'h12', description: 'Trabajo administrativo y limpieza taller', hours: 2, date: date(1) },
    { id: 'h13', description: 'Purga de frenos Golf — retest', hours: 0.5, date: date(22), order_id: 'o2' },
  ]

  const db = {
    users: [],
    clients,
    vehicles,
    orders,
    order_services: orderServices,
    service_catalog: services,
    invoices,
    hours_tracking: hoursTracking,
    photos: [],
    currentUser: null,
    invoiceCounter: 5,
  }

  localStorage.setItem(DB_KEY, JSON.stringify(db))
  return true
}

export function clearAll() {
  localStorage.removeItem(DB_KEY)
  return true
}
