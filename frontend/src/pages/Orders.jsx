import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { orders as ordersApi, vehicles as vehiclesApi, services as servicesApi } from '../services/api-neon'
import { useAuth } from '../context/AuthContext'
import { Modal, Input, Select, Textarea, StatusBadge } from '../components/ui'
import { formatDate } from '../utils/formatters'

const tabs = [
  { key: '', label: 'Todas' },
  { key: 'PENDING', label: 'Pendientes' },
  { key: 'IN_PROGRESS', label: 'En progreso' },
  { key: 'COMPLETED', label: 'Completadas' },
]

export default function Orders() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const isClient = user?.role === 'client'
  const [orders, setOrders] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [catalog, setCatalog] = useState([])
  const [filter, setFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [form, setForm] = useState({ vehicle_id: '', description: '', mileage: '', notes: '' })

  useEffect(() => { load(); if (!isClient) { loadVehicles(); loadCatalog(); } }, [])

  async function load() {
    try {
      setLoading(true)
      const res = await ordersApi.list({ status: filter || undefined })
      setOrders(res.items || [])
    } catch(e) { console.error(e) } finally { setLoading(false) }
  }

  async function loadVehicles() {
    try {
      const res = await vehiclesApi.list()
      setVehicles(res.items || [])
    } catch(e) { console.error(e) }
  }

  async function loadCatalog() {
    try {
      const res = await servicesApi.list()
      setCatalog(res.items || [])
    } catch(e) { console.error(e) }
  }

  useEffect(() => { load() }, [filter])

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      await ordersApi.create({ ...form, mileage: form.mileage ? parseInt(form.mileage) : null })
      setShowNew(false); load()
    } catch(err) { alert(err.message) }
  }

  const statusLabel = { PENDING: 'Pendiente', IN_PROGRESS: 'En progreso', COMPLETED: 'Completada', CANCELLED: 'Cancelada' }

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Órdenes de Trabajo</h1>
          <p className="page-subtitle">{orders.length} órdenes</p>
        </div>
        {!isClient && (
          <button onClick={() => { setForm({ vehicle_id: '', description: '', mileage: '', notes: '' }); setShowNew(true) }} className="btn-primary">+ Nueva orden</button>
        )}
      </div>

      <div className="flex gap-1 mb-5 p-1 bg-white/[0.03] rounded-xl border border-white/[0.05] w-fit">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setFilter(t.key)}
            className={`px-4 py-2 rounded-lg text-[12px] font-medium transition-all duration-200 ${filter === t.key ? 'bg-white/[0.1] text-white shadow-sm' : 'text-white/30 hover:text-white/50'}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        {loading ? <div className="py-16 text-center text-white/30 text-sm">Cargando...</div>
        : orders.length === 0 ? (
          <div className="py-16 text-center">
            <svg className="w-10 h-10 mx-auto mb-3 text-white/10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25" /></svg>
            <p className="text-sm text-white/30">No hay órdenes</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {orders.map(o => (
              <div key={o.id} className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors group cursor-pointer" onClick={() => navigate('/vehicles/' + o.vehicle_id)}>
                <div className="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center text-[11px] font-bold text-white/40 shrink-0">
                  {o.plate?.slice(0, 2) || '--'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-semibold text-white font-mono">{o.plate || 'N/A'}</span>
                    <span className="text-[11px] text-white/15">·</span>
                    <span className="text-[13px] text-white/50">{o.brand} {o.model}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] text-white/25">{formatDate(o.created_at)}</span>
                  </div>
                </div>
                <StatusBadge status={o.status} />
                {!isClient && (
                  <button onClick={(e) => { e.stopPropagation(); if(confirm('¿Eliminar orden?')) ordersApi.remove(o.id).then(load) }} className="btn-ghost text-red-400/30 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">Eliminar</button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {!isClient && (
        <Modal open={showNew} onClose={() => setShowNew(false)} title="Nueva orden de trabajo">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Select label="Vehículo *" value={form.vehicle_id} onChange={(e) => setForm({ ...form, vehicle_id: e.target.value })} required>
              <option value="">Seleccionar vehículo</option>
              {vehicles.map(v => <option key={v.id} value={v.id}>{v.plate} — {v.brand} {v.model}</option>)}
            </Select>
            <Textarea label="Descripción del problema" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Describí el problema o servicio solicitado..." />
            <Input label="Kilometraje actual" type="number" value={form.mileage} onChange={(e) => setForm({ ...form, mileage: e.target.value })} placeholder="120000" />
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowNew(false)} className="btn-secondary flex-1">Cancelar</button>
              <button type="submit" className="btn-primary flex-1">Crear orden</button>
            </div>
          </form>
        </Modal>
      )}

      
    </div>
  )
}
