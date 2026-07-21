import { useState, useEffect } from 'react'
import { clients as clientsApi } from '../services/api-neon'
import { useAuth } from '../context/AuthContext'
import { Modal, Input, Textarea, EmptyState } from '../components/ui'

export default function Clients() {
  const { user } = useAuth()
  const isClient = user?.role === 'client'
  const [clients, setClients] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', phone: '', email: '', dni: '', address: '', notes: '' })

  useEffect(() => { load() }, [])

  async function load() {
    try {
      setLoading(true)
      const res = await clientsApi.list({ search: search || undefined })
      setClients(res.items || [])
    } catch(e) { console.error(e) } finally { setLoading(false) }
  }

  useEffect(() => { const t = setTimeout(() => load(), 300); return () => clearTimeout(t) }, [search])

  function openNew() { setEditing(null); setForm({ name: '', phone: '', email: '', dni: '', address: '', notes: '' }); setShowModal(true) }
  function openEdit(c) { setEditing(c); setForm({ name: c.name, phone: c.phone, email: c.email || '', dni: c.dni, address: c.address || '', notes: c.notes || '' }); setShowModal(true) }

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      if (editing) await clientsApi.update({ id: editing.id, ...form }); else await clientsApi.create(form)
      setShowModal(false); load()
    } catch (err) { alert('Error: ' + err.message) }
  }

  async function handleDelete(c) {
    if (!confirm(`¿Eliminar cliente ${c.name}?`)) return
    try { await clientsApi.remove(c.id); load() } catch (err) { alert('Error: ' + err.message) }
  }

  const getInitials = (name) => name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Clientes</h1>
          <p className="page-subtitle">{clients.length} clientes registrados</p>
        </div>
        {!isClient && <button onClick={openNew} className="btn-primary">+ Nuevo cliente</button>}
      </div>

      <div className="mb-5">
        <div className="relative max-w-md">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input type="text" placeholder="Buscar por nombre, teléfono o DNI..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="input pl-10" />
        </div>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-white/30 text-sm">Cargando...</div>
        ) : clients.length === 0 ? (
          <EmptyState
            icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>}
            title={isClient ? "Sin datos" : "No hay clientes"}
            description={isClient ? "No se encontraron datos" : "Registrá tu primer cliente para comenzar"}
          />
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {clients.map((client) => (
              <div key={client.id} className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors group">
                <div className="w-10 h-10 rounded-xl bg-white/[0.06] border border-white/[0.06] flex items-center justify-center text-[11px] font-bold text-white/40 shrink-0">
                  {getInitials(client.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium text-white truncate">{client.name}</div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-[11px] text-white/30">{client.phone}</span>
                    <span className="text-[11px] text-white/15">·</span>
                    <span className="text-[11px] text-white/30 font-mono">{client.dni}</span>
                    {client.email && <><span className="text-[11px] text-white/15">·</span><span className="text-[11px] text-white/30">{client.email}</span></>}
                  </div>
                </div>
                {!isClient && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(client)} className="btn-ghost">Editar</button>
                    <button onClick={() => handleDelete(client)} className="btn-ghost text-red-400/50 hover:text-red-400">Eliminar</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {!isClient && (
        <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Editar cliente' : 'Nuevo cliente'}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Nombre completo" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Juan Pérez" />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Teléfono" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required placeholder="11-1234-5678" />
              <Input label="DNI" value={form.dni} onChange={(e) => setForm({ ...form, dni: e.target.value })} required placeholder="12345678" />
            </div>
            <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="juan@email.com" />
            <Input label="Dirección" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Av. Principal 1234" />
            <Textarea label="Notas" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} placeholder="Notas sobre el cliente..." />
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancelar</button>
              <button type="submit" className="btn-primary flex-1">{editing ? 'Guardar cambios' : 'Crear cliente'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
