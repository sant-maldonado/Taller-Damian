import { useState, useEffect } from 'react'
import { hours as hoursApi, orders as ordersApi } from '../services/api-neon'
import { formatDate, formatHours } from '../utils/formatters'
import { Modal, Input, Select, EmptyState } from '../components/ui'
import Loading from '../components/Loading'

export default function Hours() {
  const [entries, setEntries] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [filterDate, setFilterDate] = useState('')
  const [form, setForm] = useState({ order_id: '', description: '', hours: '', date: new Date().toISOString().split('T')[0] })

  useEffect(() => { load() }, [filterDate])
  useEffect(() => { loadOrders() }, [])

  async function load() {
    try {
      setLoading(true)
      const params = {}
      if (filterDate) { params.date = filterDate }
      const res = await hoursApi.list(params)
      setEntries(res.items || [])
    } catch(e) { console.error(e) } finally { setLoading(false) }
  }
  async function loadOrders() { try { const res = await ordersApi.list(); setOrders(res.items || []) } catch(e) { console.error(e) } }

  async function handleSubmit(e) { e.preventDefault(); try { await hoursApi.create({ order_id: form.order_id || null, description: form.description, hours: parseFloat(form.hours), date: form.date }); setShowModal(false); setForm({ order_id: '', description: '', hours: '', date: new Date().toISOString().split('T')[0] }); load() } catch(err) { alert(err.message) } }
  async function handleDelete(id) { if (!confirm('¿Eliminar registro?')) return; try { await hoursApi.remove(id); load() } catch(err) { alert(err.message) } }

  const totalH = entries.reduce((s, e) => s + parseFloat(e.hours), 0)

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Tracking de Horas</h1>
          <p className="page-subtitle">Total: <span className="text-white font-semibold">{formatHours(totalH)}</span> registradas</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">+ Registrar horas</button>
      </div>

      <div className="flex items-center gap-3 mb-5">
        <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="input w-auto" />
        {filterDate && <button onClick={() => setFilterDate('')} className="btn-ghost text-[12px]">Limpiar filtro</button>}
      </div>

      <div className="card overflow-hidden">
        {loading ? <Loading />
        : entries.length === 0 ? (
          <EmptyState icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} title="No hay registros" description="Registrá horas trabajadas" />
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {entries.map(e => (
              <div key={e.id} className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors group">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] text-white">{e.description || 'Sin descripción'}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] text-white/25">{formatDate(e.date)}</span>
                    {e.orders?.vehicles?.plate && <><span className="text-[11px] text-white/10">·</span><span className="text-[11px] text-white/25 font-mono">{e.orders.vehicles.plate}</span></>}
                  </div>
                </div>
                <div className="text-[14px] font-bold text-white font-mono mr-3">{formatHours(e.hours)}</div>
                <button onClick={() => handleDelete(e.id)} className="btn-ghost text-red-400/30 hover:text-red-400 sm:opacity-0 sm:group-hover:opacity-100 transition-all">Eliminar</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Registrar horas">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Fecha *" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
          <Input label="Horas trabajadas *" type="number" step="0.25" min="0.25" value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })} required placeholder="2.5" />
          <Input label="Descripción *" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required placeholder="Reparación de motor" />
          <Select label="Orden de trabajo (opcional)" value={form.order_id} onChange={(e) => setForm({ ...form, order_id: e.target.value })}>
            <option value="">Sin orden asociada</option>
            {orders.map(o => <option key={o.id} value={o.id}>{o.vehicles?.plate} — {o.vehicles?.clients?.name}</option>)}
          </Select>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancelar</button>
            <button type="submit" className="btn-primary flex-1">Registrar</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
