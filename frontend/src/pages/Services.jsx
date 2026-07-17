import { useState, useEffect } from 'react'
import { getServiceCatalog, addServiceCatalogItem, deleteServiceCatalogItem } from '../services/api'
import { Modal, Input, Textarea, EmptyState } from '../components/ui'

export default function Services() {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', default_price: '', category: '' })

  useEffect(() => { load() }, [])

  async function load() { try { setLoading(true); setServices(await getServiceCatalog()) } catch(e) { console.error(e) } finally { setLoading(false) } }
  async function handleSubmit(e) { e.preventDefault(); try { await addServiceCatalogItem({ ...form, default_price: parseFloat(form.default_price) }); setShowModal(false); setForm({ name: '', description: '', default_price: '', category: '' }); load() } catch(err) { alert(err.message) } }
  async function handleDelete(id) { if (!confirm('¿Eliminar servicio?')) return; try { await deleteServiceCatalogItem(id); load() } catch(err) { alert(err.message) } }

  const categories = [...new Set(services.map(s => s.category).filter(Boolean))]

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Servicios</h1>
          <p className="page-subtitle">{services.length} servicios en catálogo</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">+ Nuevo servicio</button>
      </div>

      {loading ? <div className="py-16 text-center text-white/30 text-sm">Cargando...</div>
      : categories.length === 0 ? (
        <EmptyState icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17l-5.384 5.384a2.025 2.025 0 01-2.864-2.864l5.384-5.384m2.864 2.864L17.5 9.5" /></svg>} title="No hay servicios" description="Agregá servicios al catálogo" />
      ) : (
        <div className="space-y-6">
          {categories.map(cat => (
            <div key={cat}>
              <h2 className="text-[11px] font-semibold text-white/30 uppercase tracking-widest mb-3 px-1">{cat}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {services.filter(s => s.category === cat).map(svc => (
                  <div key={svc.id} className="card group p-5 hover:border-white/[0.12] transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-[13px] font-medium text-white">{svc.name}</h3>
                      <button onClick={() => handleDelete(svc.id)} className="text-white/15 hover:text-red-400 text-lg leading-none opacity-0 group-hover:opacity-100 transition-all -mt-1">&times;</button>
                    </div>
                    {svc.description && <p className="text-[12px] text-white/30 mb-3 line-clamp-2">{svc.description}</p>}
                    <div className="text-[15px] font-bold text-white">${parseFloat(svc.default_price).toLocaleString('es-AR')}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Nuevo servicio">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Nombre *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Cambio de aceite" />
          <Input label="Descripción" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Incluye filtro" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Precio *" type="number" value={form.default_price} onChange={(e) => setForm({ ...form, default_price: e.target.value })} required placeholder="5000" />
            <Input label="Categoría" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Mantenimiento" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancelar</button>
            <button type="submit" className="btn-primary flex-1">Crear servicio</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
