import { useState, useEffect } from 'react'
import { getOrders, createOrder, updateOrder, deleteOrder, getVehicles, getOrderServices, addOrderService, removeOrderService, getServiceCatalog, createInvoice } from '../services/api'
import { Modal, Input, Select, Textarea, StatusBadge } from '../components/ui'
import { formatDate } from '../utils/formatters'

const tabs = [
  { key: '', label: 'Todas' },
  { key: 'PENDING', label: 'Pendientes' },
  { key: 'IN_PROGRESS', label: 'En progreso' },
  { key: 'COMPLETED', label: 'Completadas' },
]

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [catalog, setCatalog] = useState([])
  const [filter, setFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [detail, setDetail] = useState(null)
  const [services, setServices] = useState([])
  const [form, setForm] = useState({ vehicle_id: '', description: '', mileage: '', notes: '' })
  const [newSvc, setNewSvc] = useState({ name: '', price: '' })

  useEffect(() => { load(); loadVehicles(); loadCatalog() }, [])

  async function load() { try { setLoading(true); setOrders(await getOrders(filter || null)) } catch(e) { console.error(e) } finally { setLoading(false) } }
  async function loadVehicles() { try { setVehicles(await getVehicles()) } catch(e) { console.error(e) } }
  async function loadCatalog() { try { setCatalog(await getServiceCatalog()) } catch(e) { console.error(e) } }
  useEffect(() => { load() }, [filter])

  async function openDetail(o) { try { setDetail(o); setServices(await getOrderServices(o.id)) } catch(e) { console.error(e) } }
  async function handleSubmit(e) { e.preventDefault(); try { await createOrder({ ...form, mileage: form.mileage ? parseInt(form.mileage) : null }); setShowNew(false); load() } catch(err) { alert(err.message) } }
  async function handleStatus(id, s) { try { await updateOrder(id, { status: s }); load(); if (detail?.id === id) setDetail({ ...detail, status: s }) } catch(err) { alert(err.message) } }
  async function addSvc(item) { if (!detail) return; try { await addOrderService({ order_id: detail.id, service_catalog_id: item.id, name: item.name, price: item.default_price }); setServices(await getOrderServices(detail.id)) } catch(err) { alert(err.message) } }
  async function addCustom() { if (!detail || !newSvc.name || !newSvc.price) return; try { await addOrderService({ order_id: detail.id, name: newSvc.name, price: parseFloat(newSvc.price) }); setServices(await getOrderServices(detail.id)); setNewSvc({ name: '', price: '' }) } catch(err) { alert(err.message) } }
  async function rmSvc(id) { try { await removeOrderService(id); setServices(await getOrderServices(detail.id)) } catch(err) { alert(err.message) } }
  async function delOrder(o) { if (!confirm('¿Eliminar orden?')) return; try { await deleteOrder(o.id); load() } catch(err) { alert(err.message) } }
  async function genInvoice() { if (!detail) return; try { const total = services.reduce((s, sv) => s + parseFloat(sv.price), 0); await createInvoice({ order_id: detail.id, total }); alert('Factura generada ✓') } catch(err) { alert(err.message) } }

  const total = services.reduce((s, sv) => s + parseFloat(sv.price), 0)

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Órdenes de Trabajo</h1>
          <p className="page-subtitle">{orders.length} órdenes</p>
        </div>
        <button onClick={() => { setForm({ vehicle_id: '', description: '', mileage: '', notes: '' }); setShowNew(true) }} className="btn-primary">+ Nueva orden</button>
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
              <div key={o.id} className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors group cursor-pointer" onClick={() => openDetail(o)}>
                <div className="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center text-[11px] font-bold text-white/40 shrink-0">
                  {o.vehicles?.plate?.slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-semibold text-white font-mono">{o.vehicles?.plate}</span>
                    <span className="text-[11px] text-white/15">·</span>
                    <span className="text-[13px] text-white/50">{o.vehicles?.brand} {o.vehicles?.model}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] text-white/25">{o.vehicles?.clients?.name || 'Sin cliente'}</span>
                    <span className="text-[11px] text-white/10">·</span>
                    <span className="text-[11px] text-white/25">{formatDate(o.created_at)}</span>
                  </div>
                </div>
                <StatusBadge status={o.status} />
                <button onClick={(e) => { e.stopPropagation(); delOrder(o) }} className="btn-ghost text-red-400/30 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">Eliminar</button>
              </div>
            ))}
          </div>
        )}
      </div>

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

      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setDetail(null)} />
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#0c0c0c] border border-white/[0.08] rounded-2xl shadow-2xl">
            <div className="sticky top-0 z-10 bg-[#0c0c0c] px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
              <h2 className="text-[15px] font-semibold text-white">Detalle de Orden</h2>
              <button onClick={() => setDetail(null)} className="w-8 h-8 flex items-center justify-center rounded-lg text-white/30 hover:text-white hover:bg-white/[0.06] transition-all">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="px-6 py-5 space-y-6">
              <div className="grid grid-cols-2 gap-4 text-[13px]">
                <div className="space-y-1">
                  <span className="text-[11px] text-white/30 uppercase tracking-wider">Vehículo</span>
                  <div className="text-white">{detail.vehicles?.plate} — {detail.vehicles?.brand} {detail.vehicles?.model}</div>
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] text-white/30 uppercase tracking-wider">Cliente</span>
                  <div className="text-white">{detail.vehicles?.clients?.name}</div>
                  <div className="text-white/40 text-[12px]">{detail.vehicles?.clients?.phone}</div>
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] text-white/30 uppercase tracking-wider">Kilometraje</span>
                  <div className="text-white font-mono">{detail.mileage ? `${detail.mileage.toLocaleString()} km` : '-'}</div>
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] text-white/30 uppercase tracking-wider">Estado</span>
                  <div className="flex gap-2 mt-1">
                    {['PENDING','IN_PROGRESS','COMPLETED'].map(s => (
                      <button key={s} onClick={() => handleStatus(detail.id, s)}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${detail.status === s ? 'bg-white text-black' : 'bg-white/[0.04] text-white/30 hover:text-white/60 border border-white/[0.06]'}`}>
                        {s === 'PENDING' ? 'Pendiente' : s === 'IN_PROGRESS' ? 'En progreso' : 'Completado'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-[11px] font-semibold text-white/40 uppercase tracking-wider mb-3">Agregar servicio</h3>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {catalog.map(c => (
                    <button key={c.id} onClick={() => addSvc(c)}
                      className="flex items-center justify-between px-3 py-2.5 bg-white/[0.03] border border-white/[0.05] rounded-xl text-[12px] text-white/50 hover:border-white/[0.12] hover:text-white/80 transition-all text-left">
                      <span className="truncate">{c.name}</span>
                      <span className="text-white/20 ml-2 shrink-0">${c.default_price?.toLocaleString('es-AR')}</span>
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input type="text" placeholder="Servicio personalizado" value={newSvc.name} onChange={(e) => setNewSvc({ ...newSvc, name: e.target.value })} className="input flex-1" />
                  <input type="number" placeholder="$" value={newSvc.price} onChange={(e) => setNewSvc({ ...newSvc, price: e.target.value })} className="input w-24" />
                  <button onClick={addCustom} className="px-4 py-2 bg-white/[0.06] text-white/40 text-sm rounded-xl hover:bg-white/[0.1] hover:text-white transition-all border border-white/[0.06]">+</button>
                </div>
              </div>

              {services.length > 0 && (
                <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl overflow-hidden">
                  <div className="divide-y divide-white/[0.04]">
                    {services.map(s => (
                      <div key={s.id} className="flex items-center justify-between px-4 py-3">
                        <span className="text-[13px] text-white/70">{s.name}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-[13px] text-white/40 font-mono">${parseFloat(s.price).toLocaleString('es-AR')}</span>
                          <button onClick={() => rmSvc(s.id)} className="text-white/20 hover:text-red-400 transition-colors text-sm">&times;</button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between px-4 py-3.5 border-t border-white/[0.06] bg-white/[0.02]">
                    <span className="text-[13px] font-semibold text-white">Total</span>
                    <span className="text-[15px] font-bold text-white">${total.toLocaleString('es-AR')}</span>
                  </div>
                </div>
              )}

              {services.length > 0 && detail.status === 'COMPLETED' && (
                <button onClick={genInvoice} className="w-full py-3 bg-white text-black text-sm font-semibold rounded-xl hover:bg-white/90 active:scale-[0.98] transition-all">
                  Generar Factura
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
