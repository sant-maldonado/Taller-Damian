import { useState, useEffect } from 'react'
import { users as usersApi, roles as rolesApi } from '../services/api-neon'
import { Modal, Input, Select, EmptyState } from '../components/ui'
import Loading from '../components/Loading'

const ROLE_LABELS = { admin: 'Administrador', manager: 'Gerente', mechanic: 'Mecánico', client: 'Cliente', viewer: 'Observador' }
const ROLE_COLORS = { admin: 'text-red-400', manager: 'text-blue-400', mechanic: 'text-amber-400', client: 'text-emerald-400', viewer: 'text-white/40' }

export default function Users() {
  const [users, setUsers] = useState([])
  const [roles, setRoles] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', role_name: 'mechanic' })

  useEffect(() => { load(); loadRoles() }, [])

  async function load() {
    try {
      setLoading(true)
      const data = await usersApi.list()
      setUsers(data || [])
    } catch(e) { console.error(e) } finally { setLoading(false) }
  }

  async function loadRoles() {
    try {
      const data = await rolesApi.list()
      setRoles(data || [])
    } catch(e) { console.error(e) }
  }

  function openNew() {
    setEditing(null)
    setForm({ name: '', email: '', password: '', phone: '', role_name: 'mechanic' })
    setShowModal(true)
  }

  function openEdit(u) {
    setEditing(u)
    setForm({ name: u.name, email: u.email, password: '', phone: u.phone || '', role_name: u.role_name })
    setShowModal(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      if (editing) {
        const payload = { id: editing.id, name: form.name, phone: form.phone, role_name: form.role_name, is_active: editing.is_active !== false }
        await usersApi.update(payload)
      } else {
        if (!form.password) return alert('La contraseña es requerida para crear un usuario')
        await usersApi.create({ ...form })
      }
      setShowModal(false)
      load()
    } catch (err) { alert('Error: ' + err.message) }
  }

  async function handleDeactivate(u) {
    if (!confirm(`¿Desactivar usuario ${u.name}?`)) return
    try { await usersApi.remove(u.id); load() } catch (err) { alert('Error: ' + err.message) }
  }

  const getInitials = (name) => name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  const filtered = users.filter(u => {
    if (!search) return true
    const s = search.toLowerCase()
    return u.name?.toLowerCase().includes(s) || u.email?.toLowerCase().includes(s) || u.role_name?.toLowerCase().includes(s)
  })

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Usuarios</h1>
          <p className="page-subtitle">{users.length} usuarios en el sistema</p>
        </div>
        <button onClick={openNew} className="btn-primary">+ Nuevo usuario</button>
      </div>

      <div className="mb-5">
        <div className="relative max-w-md">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input type="text" placeholder="Buscar por nombre, email o rol..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="input pl-10" />
        </div>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <Loading />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>}
            title="No hay usuarios"
            description="Creá el primer usuario para comenzar"
          />
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {filtered.map((u) => (
              <div key={u.id} className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors group">
                <div className="w-10 h-10 rounded-xl bg-white/[0.06] border border-white/[0.06] flex items-center justify-center text-[11px] font-bold text-white/40 shrink-0">
                  {getInitials(u.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-medium text-white truncate">{u.name}</span>
                    {u.is_active === false && (
                      <span className="text-[10px] font-medium text-red-400/60 bg-red-400/[0.08] px-1.5 py-0.5 rounded">Inactivo</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-[11px] text-white/30">{u.email}</span>
                    {u.phone && <><span className="text-[11px] text-white/15">·</span><span className="text-[11px] text-white/30">{u.phone}</span></>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-[11px] font-medium ${ROLE_COLORS[u.role_name] || 'text-white/40'}`}>
                    {ROLE_LABELS[u.role_name] || u.role_name}
                  </span>
                  <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(u)} className="btn-ghost">Editar</button>
                    {u.is_active !== false && (
                      <button onClick={() => handleDeactivate(u)} className="btn-ghost text-red-400/50 hover:text-red-400">Desactivar</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Editar usuario' : 'Nuevo usuario'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Nombre completo" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Juan Pérez" />
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required placeholder="juan@email.com" disabled={!!editing} />
          {!editing && (
            <Input label="Contraseña" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required placeholder="Mínimo 6 caracteres" />
          )}
          <div className="grid grid-cols-2 gap-4">
            <Input label="Teléfono" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="11-1234-5678" />
            <Select label="Rol" value={form.role_name} onChange={(e) => setForm({ ...form, role_name: e.target.value })} required>
              {roles.map(r => (
                <option key={r.id} value={r.name}>{ROLE_LABELS[r.name] || r.name}</option>
              ))}
            </Select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancelar</button>
            <button type="submit" className="btn-primary flex-1">{editing ? 'Guardar cambios' : 'Crear usuario'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
