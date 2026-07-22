import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { vehicles as vehiclesApi, clients as clientsApi } from '../services/api-neon'
import { useAuth } from '../context/AuthContext'
import { Modal, Input, Select, EmptyState } from '../components/ui'
import { engineLabel, transLabel } from '../utils/formatters'
import Loading from '../components/Loading'

export default function Vehicles() {
  const { user } = useAuth()
  const isClient = user?.role === 'client'
  const navigate = useNavigate()
  const [vehicles, setVehicles] = useState([])
  const [clients, setClients] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ brand: '', model: '', year: '', plate: '', color: '', vin: '', client_id: '', current_km: '', engine_type: '', transmission: '' })

  useEffect(() => { load(); if (!isClient) loadClients() }, [])

  async function load(searchTerm) {
    try {
      setLoading(true)
      const params = searchTerm ? { search: searchTerm } : {}
      const res = await vehiclesApi.list(params)
      setVehicles(res.items || [])
    } catch(e) { console.error(e) } finally { setLoading(false) }
  }

  async function loadClients() {
    try {
      const res = await clientsApi.list()
      setClients(res.items || [])
    } catch(e) { console.error(e) }
  }

  useEffect(() => { if (search === '') { load(); return } const t = setTimeout(() => load(search), 300); return () => clearTimeout(t) }, [search])

  function openNew() { setEditing(null); setForm({ brand: '', model: '', year: '', plate: '', color: '', vin: '', client_id: '', current_km: '', engine_type: '', transmission: '' }); setShowModal(true) }
  function openEdit(v) { setEditing(v); setForm({ brand: v.brand, model: v.model, year: v.year, plate: v.plate, color: v.color || '', vin: v.vin || '', client_id: v.client_id, current_km: v.current_km || '', engine_type: v.engine_type || '', transmission: v.transmission || '' }); setShowModal(true) }

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      const p = { ...form, year: parseInt(form.year), current_km: form.current_km ? parseInt(form.current_km) : null }
      if (editing) await vehiclesApi.update({ id: editing.id, ...p })
      else await vehiclesApi.create(p)
      setShowModal(false); load()
    } catch(err) { alert('Error: ' + err.message) }
  }

  async function handleDelete(e, v) {
    e.stopPropagation()
    if (!confirm(`¿Eliminar vehículo ${v.plate}?`)) return
    try { await vehiclesApi.remove(v.id); load() } catch(err) { alert('Error: ' + err.message) }
  }

  const getColor = (brand) => {
    const colors = ['bg-blue-500/10 text-blue-400', 'bg-violet-500/10 text-violet-400', 'bg-emerald-500/10 text-emerald-400', 'bg-amber-500/10 text-amber-400', 'bg-rose-500/10 text-rose-400', 'bg-cyan-500/10 text-cyan-400']
    let hash = 0; for (let i = 0; i < brand.length; i++) hash = brand.charCodeAt(i) + ((hash << 5) - hash); return colors[Math.abs(hash) % colors.length]
  }

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {isClient && <button onClick={() => navigate('/')} className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center hover:bg-white/[0.1] transition-colors">
            <svg className="w-4 h-4 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
          </button>}
          <div>
            <h1 className="page-title">Vehículos</h1>
            <p className="page-subtitle">{vehicles.length} vehículos registrados</p>
          </div>
        </div>
        {!isClient && <button onClick={openNew} className="btn-primary">+ Nuevo vehículo</button>}
      </div>

      <div className="mb-5">
        <div className="relative max-w-md">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
          <input type="text" placeholder="Buscar por marca, modelo o patente..." value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-10" />
        </div>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <Loading />
        ) : vehicles.length === 0 ? (
          <EmptyState
            icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.144-.506 1.144-1.125v-1.5c0-.621-.523-1.125-1.144-1.125H18.375m-5.25 0H5.625c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125h10.5M3.75 5.25h16.5" /></svg>}
            title="No hay vehículos"
            description={isClient ? "No tenés vehículos registrados" : "Registrá tu primer vehículo para comenzar"}
          />
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {vehicles.map((v) => (
              <div key={v.id} onClick={() => navigate(`/vehicles/${v.id}`)} className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors group cursor-pointer">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-[11px] font-bold shrink-0 ${getColor(v.brand)}`}>
                  {v.brand?.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-semibold text-white font-mono">{v.plate}</span>
                    <span className="text-[11px] text-white/15">·</span>
                    <span className="text-[13px] text-white/60">{v.brand} {v.model}</span>
                    <span className="text-[11px] text-white/15">·</span>
                    <span className="text-[11px] text-white/30">{v.year}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    {!isClient && <span className="text-[11px] text-white/30">Dueño: {v.client_name || 'Sin asignar'}</span>}
                    {v.current_km != null && <span className="text-[11px] text-white/25">{v.current_km.toLocaleString()} km</span>}
                    {v.engine_type && <span className="text-[11px] text-white/25">{engineLabel(v.engine_type)}</span>}
                    {v.transmission && <span className="text-[11px] text-white/25">{transLabel(v.transmission)}</span>}
                  </div>
                </div>
                {!isClient && (
                  <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => openEdit(v)} className="btn-ghost">Editar</button>
                    <button onClick={(e) => handleDelete(e, v)} className="btn-ghost text-red-400/50 hover:text-red-400">Eliminar</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {!isClient && (
        <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Editar vehículo' : 'Nuevo vehículo'} wide>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex items-center gap-2 pb-2 border-b border-white/[0.06]">
              <div className="w-6 h-6 rounded-md bg-blue-500/10 flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>
              </div>
              <span className="text-[12px] font-semibold text-white/60 uppercase tracking-wider">Dueño</span>
            </div>
            <Select label="Cliente *" value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value })} required>
              <option value="">Seleccionar cliente</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>

            <div className="flex items-center gap-2 pb-2 border-b border-blue-500/10">
              <div className="w-6 h-6 rounded-md bg-blue-500/10 flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.144-.506 1.144-1.125v-1.5c0-.621-.523-1.125-1.144-1.125H18.375m-5.25 0H5.625c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125h10.5M3.75 5.25h16.5" /></svg>
              </div>
              <span className="text-[12px] font-semibold text-blue-400/60 uppercase tracking-wider">Identificación del vehículo</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Marca *" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} required placeholder="Toyota" />
              <Input label="Modelo *" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} required placeholder="Corolla" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Año *" type="number" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} required placeholder="2024" />
              <Input label="Patente *" value={form.plate} onChange={(e) => setForm({ ...form, plate: e.target.value.toUpperCase() })} required placeholder="ABC123" />
            </div>

            <div className="flex items-center gap-2 pb-2 border-b border-emerald-500/10">
              <div className="w-6 h-6 rounded-md bg-emerald-500/10 flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17l-5.384 5.384a2.025 2.025 0 01-2.864-2.864l5.384-5.384m2.864 2.864L17.5 9.5m-2.08 5.67l3.5 3.5M6.343 6.343l2.122 2.122m0 0l1.414 1.414M6.343 6.343l-2.122-2.122m12.02 7.778l2.122 2.122m0 0l-2.122 2.122M18.484 14.12l2.122-2.122" /></svg>
              </div>
              <span className="text-[12px] font-semibold text-emerald-400/60 uppercase tracking-wider">Detalles técnicos</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} placeholder="Gris" />
              <Input label="VIN" value={form.vin} onChange={(e) => setForm({ ...form, vin: e.target.value })} placeholder="1HGBH41JXMN109186" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Input label="Kilometraje" type="number" value={form.current_km} onChange={(e) => setForm({ ...form, current_km: e.target.value })} placeholder="85000" />
              <Select label="Motor" value={form.engine_type} onChange={(e) => setForm({ ...form, engine_type: e.target.value })}>
                <option value="">Sin especificar</option>
                <option value="naftero">Naftero</option>
                <option value="diesel">Diésel</option>
                <option value="naftero_gasoleta">Naftero/Gasoleta</option>
              </Select>
              <Select label="Transmisión" value={form.transmission} onChange={(e) => setForm({ ...form, transmission: e.target.value })}>
                <option value="">Sin especificar</option>
                <option value="manual">Manual</option>
                <option value="automatica">Automática</option>
              </Select>
            </div>

            <div className="flex gap-3 pt-3 border-t border-white/[0.06]">
              <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1 flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                Cancelar
              </button>
              <button type="submit" className="btn-primary flex-1 flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                {editing ? 'Guardar cambios' : 'Crear vehículo'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
