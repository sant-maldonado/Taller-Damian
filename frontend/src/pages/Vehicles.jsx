import { useState, useEffect } from 'react'
import { getVehicles, createVehicle, updateVehicle, deleteVehicle, getClients } from '../services/api'
import { Modal, Input, Select, EmptyState } from '../components/ui'

export default function Vehicles() {
  const [vehicles, setVehicles] = useState([])
  const [clients, setClients] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ brand: '', model: '', year: '', plate: '', color: '', vin: '', client_id: '' })

  useEffect(() => { load(); loadClients() }, [])

  async function load() { try { setLoading(true); setVehicles(await getVehicles(null, search)) } catch(e) { console.error(e) } finally { setLoading(false) } }
  async function loadClients() { try { setClients(await getClients()) } catch(e) { console.error(e) } }
  useEffect(() => { const t = setTimeout(() => load(), 300); return () => clearTimeout(t) }, [search])

  function openNew() { setEditing(null); setForm({ brand: '', model: '', year: '', plate: '', color: '', vin: '', client_id: '' }); setShowModal(true) }
  function openEdit(v) { setEditing(v); setForm({ brand: v.brand, model: v.model, year: v.year, plate: v.plate, color: v.color || '', vin: v.vin || '', client_id: v.client_id }); setShowModal(true) }

  async function handleSubmit(e) {
    e.preventDefault()
    try { const p = { ...form, year: parseInt(form.year) }; if (editing) await updateVehicle(editing.id, p); else await createVehicle(p); setShowModal(false); load() } catch(err) { alert('Error: ' + err.message) }
  }

  async function handleDelete(v) { if (!confirm(`¿Eliminar vehículo ${v.plate}?`)) return; try { await deleteVehicle(v.id); load() } catch(err) { alert('Error: ' + err.message) } }

  const getColor = (brand) => {
    const colors = ['bg-blue-500/10 text-blue-400', 'bg-violet-500/10 text-violet-400', 'bg-emerald-500/10 text-emerald-400', 'bg-amber-500/10 text-amber-400', 'bg-rose-500/10 text-rose-400', 'bg-cyan-500/10 text-cyan-400']
    let hash = 0; for (let i = 0; i < brand.length; i++) hash = brand.charCodeAt(i) + ((hash << 5) - hash); return colors[Math.abs(hash) % colors.length]
  }

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Vehículos</h1>
          <p className="page-subtitle">{vehicles.length} vehículos registrados</p>
        </div>
        <button onClick={openNew} className="btn-primary">+ Nuevo vehículo</button>
      </div>

      <div className="mb-5">
        <div className="relative max-w-md">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
          <input type="text" placeholder="Buscar por marca, modelo o patente..." value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-10" />
        </div>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-white/30 text-sm">Cargando...</div>
        ) : vehicles.length === 0 ? (
          <EmptyState
            icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.144-.506 1.144-1.125v-1.5c0-.621-.523-1.125-1.144-1.125H18.375m-5.25 0H5.625c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125h10.5M3.75 5.25h16.5" /></svg>}
            title="No hay vehículos"
            description="Registrá tu primer vehículo para comenzar"
          />
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {vehicles.map((v) => (
              <div key={v.id} className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors group">
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
                  <div className="text-[11px] text-white/30 mt-0.5">Dueño: {v.clients?.name || 'Sin asignar'}</div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(v)} className="btn-ghost">Editar</button>
                  <button onClick={() => handleDelete(v)} className="btn-ghost text-red-400/50 hover:text-red-400">Eliminar</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Editar vehículo' : 'Nuevo vehículo'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select label="Cliente *" value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value })} required>
            <option value="">Seleccionar cliente</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Marca *" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} required placeholder="Toyota" />
            <Input label="Modelo *" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} required placeholder="Corolla" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Año *" type="number" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} required placeholder="2024" />
            <Input label="Patente *" value={form.plate} onChange={(e) => setForm({ ...form, plate: e.target.value.toUpperCase() })} required placeholder="ABC123" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} placeholder="Gris" />
            <Input label="VIN" value={form.vin} onChange={(e) => setForm({ ...form, vin: e.target.value })} placeholder="1HGBH41JXMN109186" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancelar</button>
            <button type="submit" className="btn-primary flex-1">{editing ? 'Guardar cambios' : 'Crear vehículo'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
