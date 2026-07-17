const DB_KEY = 'taller_mecanico_db'

function getDB() {
  const raw = localStorage.getItem(DB_KEY)
  if (!raw) {
    const initial = {
      users: [],
      clients: [],
      vehicles: [],
      orders: [],
      order_services: [],
      service_catalog: getDefaultServices(),
      invoices: [],
      hours_tracking: [],
      photos: [],
      currentUser: null,
      invoiceCounter: 0
    }
    localStorage.setItem(DB_KEY, JSON.stringify(initial))
    return initial
  }
  return JSON.parse(raw)
}

function saveDB(db) {
  localStorage.setItem(DB_KEY, JSON.stringify(db))
}

function generateId() {
  return crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2)
}

function getDefaultServices() {
  return [
    { id: generateId(), name: 'Cambio de aceite', description: 'Cambio de aceite y filtro', default_price: 5000, category: 'Mantenimiento' },
    { id: generateId(), name: 'Cambio de distribución', description: 'Cambio de correa de distribución y tensores', default_price: 25000, category: 'Mantenimiento' },
    { id: generateId(), name: 'Cambio de frenos', description: 'Cambio de pastillas y discos de freno', default_price: 15000, category: 'Frenos' },
    { id: generateId(), name: 'Alineación y balanceo', description: 'Alineación de dirección y balanceo de ruedas', default_price: 8000, category: 'Suspensión' },
    { id: generateId(), name: 'Revisión general', description: 'Revisión general del vehículo', default_price: 10000, category: 'Diagnóstico' },
    { id: generateId(), name: 'Cambio de neumáticos', description: 'Cambio de neumáticos', default_price: 40000, category: 'Rodado' },
    { id: generateId(), name: 'Reparación de motor', description: 'Reparación general de motor', default_price: 50000, category: 'Motor' },
    { id: generateId(), name: 'Cambio de transmisión', description: 'Cambio o reparación de transmisión', default_price: 35000, category: 'Transmisión' },
    { id: generateId(), name: 'Servicio de aire acondicionado', description: 'Recarga y mantenimiento de A/C', default_price: 12000, category: 'Confort' },
    { id: generateId(), name: 'Cambio de batería', description: 'Cambio de batería', default_price: 20000, category: 'Eléctrico' }
  ]
}

function query(collection, filters = {}) {
  const db = getDB()
  let items = [...(db[collection] || [])]
  if (filters.search) {
    const s = filters.search.toLowerCase()
    items = items.filter(item =>
      Object.values(item).some(v => String(v).toLowerCase().includes(s))
    )
  }
  if (filters.eq) {
    Object.entries(filters.eq).forEach(([key, val]) => {
      items = items.filter(item => item[key] === val)
    })
  }
  return items
}

function insert(collection, record) {
  const db = getDB()
  const newRecord = { ...record, id: record.id || generateId(), created_at: record.created_at || new Date().toISOString() }
  db[collection] = [...(db[collection] || []), newRecord]
  saveDB(db)
  return newRecord
}

function update(collection, id, updates) {
  const db = getDB()
  db[collection] = (db[collection] || []).map(item =>
    item.id === id ? { ...item, ...updates, updated_at: new Date().toISOString() } : item
  )
  saveDB(db)
  return db[collection].find(item => item.id === id)
}

function remove(collection, id) {
  const db = getDB()
  db[collection] = (db[collection] || []).filter(item => item.id !== id)
  saveDB(db)
}

function find(collection, id) {
  const db = getDB()
  return (db[collection] || []).find(item => item.id === id)
}

// ===== AUTH =====
export async function signIn(email, password) {
  const db = getDB()
  const user = db.users.find(u => u.email === email && u.password === password)
  if (!user) throw new Error('Email o contraseña incorrectos')
  db.currentUser = user.id
  saveDB(db)
  return { user: { id: user.id, email: user.email, name: user.name } }
}

export async function signUp(email, password, name) {
  const db = getDB()
  if (db.users.find(u => u.email === email)) throw new Error('El email ya está registrado')
  const user = { id: generateId(), email, password, name, role: 'ADMIN', created_at: new Date().toISOString() }
  db.users.push(user)
  db.currentUser = user.id
  saveDB(db)
  return { user: { id: user.id, email: user.email, name: user.name } }
}

export async function signOut() {
  const db = getDB()
  db.currentUser = null
  saveDB(db)
}

export async function getCurrentUser() {
  const db = getDB()
  if (!db.currentUser) return null
  const user = db.users.find(u => u.id === db.currentUser)
  if (!user) return null
  return { id: user.id, email: user.email, name: user.name }
}

// ===== CLIENTS =====
export async function getClients(search = '') {
  return query('clients', search ? { search } : {}).sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
}

export async function getClient(id) {
  return find('clients', id)
}

export async function createClient(data) {
  return insert('clients', data)
}

export async function updateClient(id, data) {
  return update('clients', id, data)
}

export async function deleteClient(id) {
  remove('clients', id)
}

// ===== VEHICLES =====
export async function getVehicles(clientId = null, search = '') {
  let items = query('vehicles', search ? { search } : {})
  if (clientId) items = items.filter(v => v.client_id === clientId)
  const db = getDB()
  return items.map(v => ({ ...v, clients: db.clients.find(c => c.id === v.client_id) || null })).sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
}

export async function getVehicle(id) {
  const vehicle = find('vehicles', id)
  if (!vehicle) return null
  const db = getDB()
  return { ...vehicle, clients: db.clients.find(c => c.id === vehicle.client_id) || null }
}

export async function createVehicle(data) {
  return insert('vehicles', data)
}

export async function updateVehicle(id, data) {
  return update('vehicles', id, data)
}

export async function deleteVehicle(id) {
  remove('vehicles', id)
}

// ===== ORDERS =====
export async function getOrders(status = null, search = '') {
  const db = getDB()
  let items = [...(db.orders || [])]
  if (status) items = items.filter(o => o.status === status)
  return items.map(o => {
    const vehicle = db.vehicles.find(v => v.id === o.vehicle_id) || null
    const client = vehicle ? db.clients.find(c => c.id === vehicle.client_id) || null : null
    return { ...o, vehicles: { ...vehicle, clients: client } }
  }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
}

export async function getOrder(id) {
  const db = getDB()
  const order = db.orders.find(o => o.id === id)
  if (!order) return null
  const vehicle = db.vehicles.find(v => v.id === order.vehicle_id) || null
  const client = vehicle ? db.clients.find(c => c.id === vehicle.client_id) || null : null
  return { ...order, vehicles: { ...vehicle, clients: client } }
}

export async function createOrder(data) {
  return insert('orders', { ...data, status: 'PENDING' })
}

export async function updateOrder(id, data) {
  return update('orders', id, data)
}

export async function deleteOrder(id) {
  remove('orders', id)
  const db = getDB()
  db.order_services = (db.order_services || []).filter(s => s.order_id !== id)
  saveDB(db)
}

// ===== ORDER SERVICES =====
export async function getOrderServices(orderId) {
  return query('order_services', { eq: { order_id: orderId } })
}

export async function addOrderService(service) {
  return insert('order_services', service)
}

export async function removeOrderService(id) {
  remove('order_services', id)
}

// ===== SERVICE CATALOG =====
export async function getServiceCatalog() {
  const db = getDB()
  return [...(db.service_catalog || [])].sort((a, b) => a.name.localeCompare(b.name))
}

export async function addServiceCatalogItem(item) {
  return insert('service_catalog', item)
}

export async function deleteServiceCatalogItem(id) {
  remove('service_catalog', id)
}

// ===== INVOICES =====
export async function getInvoices() {
  const db = getDB()
  return (db.invoices || []).map(inv => {
    const order = db.orders.find(o => o.id === inv.order_id) || null
    const vehicle = order ? db.vehicles.find(v => v.id === order.vehicle_id) || null : null
    const client = vehicle ? db.clients.find(c => c.id === vehicle.client_id) || null : null
    return { ...inv, orders: { vehicles: { ...vehicle, clients: client } } }
  }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
}

export async function createInvoice(data) {
  const db = getDB()
  db.invoiceCounter = (db.invoiceCounter || 0) + 1
  saveDB(db)
  return insert('invoices', { ...data, invoice_number: db.invoiceCounter })
}

// ===== HOURS TRACKING =====
export async function getHoursTracking(userId = null, startDate = null, endDate = null) {
  const db = getDB()
  let items = [...(db.hours_tracking || [])]
  if (userId) items = items.filter(h => h.user_id === userId)
  if (startDate) items = items.filter(h => h.date >= startDate)
  if (endDate) items = items.filter(h => h.date <= endDate)
  return items.map(h => {
    const user = db.users.find(u => u.id === h.user_id) || null
    const order = h.order_id ? db.orders.find(o => o.id === h.order_id) || null : null
    const vehicle = order ? db.vehicles.find(v => v.id === order.vehicle_id) || null : null
    return { ...h, users: user ? { name: user.name } : null, orders: vehicle ? { vehicles: vehicle } : null }
  }).sort((a, b) => new Date(b.date) - new Date(a.date))
}

export async function addHoursTracking(entry) {
  return insert('hours_tracking', entry)
}

export async function deleteHoursTracking(id) {
  remove('hours_tracking', id)
}
