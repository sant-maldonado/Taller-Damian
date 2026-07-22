import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { orders as ordersApi, vehicles as vehiclesApi, services as servicesApi, groq as groqApi } from '../services/api-neon'
import { useAuth } from '../context/AuthContext'
import { Modal, Input, Select, Textarea, StatusBadge, EmptyState } from '../components/ui'
import { formatDate, formatCurrency } from '../utils/formatters'
import Loading from '../components/Loading'

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
  const [suggestedServices, setSuggestedServices] = useState([])
  const [manualServices, setManualServices] = useState([])
  const [aiLoading, setAiLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef(null)

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

  function openNewModal() {
    setForm({ vehicle_id: '', description: '', mileage: '', notes: '' })
    setSuggestedServices([])
    setManualServices([])
    loadVehicles()
    setShowNew(true)
  }

  function addManualService() {
    setManualServices(prev => [...prev, { name: '', price: '0', checked: true }])
  }

  function updateManualService(index, field, value) {
    setManualServices(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s))
  }

  function removeManualService(index) {
    setManualServices(prev => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.vehicle_id) { alert('Seleccioná un vehículo'); return }
    try {
      const order = await ordersApi.create({
        vehicle_id: form.vehicle_id,
        description: form.description || null,
        mileage: form.mileage ? parseInt(form.mileage) : null,
        notes: form.notes || null,
      })

      const allServices = [
        ...suggestedServices.filter(s => s.checked),
        ...manualServices.filter(s => s.name.trim()),
      ]
      for (const svc of allServices) {
        await ordersApi.addService({ order_id: order.id, name: svc.name, price: parseFloat(svc.price || 0) })
      }

      setShowNew(false)
      setSuggestedServices([])
      setManualServices([])
      load()
    } catch(err) { alert(err.message) }
  }

  async function handleAI() {
    if (!form.description.trim()) { alert('Escribí o dictá una descripción primero'); return }
    setAiLoading(true)
    try {
      const vehicleContext = null
      const res = await groqApi.chat({
        message: form.description,
        vehicleContext,
        catalog,
      })

      setForm(prev => ({
        ...prev,
        description: res.description || form.description,
        mileage: res.mileage != null ? String(res.mileage) : form.mileage,
        notes: res.notes || prev.notes,
      }))

      if (res.services && res.services.length > 0) {
        setSuggestedServices(res.services.map(s => ({
          name: s.name,
          price: String(s.price),
          checked: true,
        })))
      }
    } catch(err) {
      alert('Error al conectar con IA: ' + err.message)
    } finally {
      setAiLoading(false)
    }
  }

  function handleVoice() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) { alert('El reconocimiento de voz solo funciona en Chrome'); return }

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop()
      setIsListening(false)
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = 'es-AR'
    recognition.continuous = false
    recognition.interimResults = false
    recognitionRef.current = recognition

    recognition.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          setForm(prev => ({ ...prev, description: (prev.description + ' ' + event.results[i][0].transcript).trim() }))
        }
      }
    }

    recognition.onerror = () => { setIsListening(false) }
    recognition.onend = () => { setIsListening(false) }

    recognition.start()
    setIsListening(true)
  }

  function updateService(index, field, value) {
    setSuggestedServices(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s))
  }

  const totalServices = [
    ...suggestedServices.filter(s => s.checked),
    ...manualServices.filter(s => s.name.trim()),
  ].reduce((sum, s) => sum + (parseFloat(s.price) || 0), 0)

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Órdenes de Trabajo</h1>
          <p className="page-subtitle">{orders.length} órdenes</p>
        </div>
        {!isClient && (
          <button onClick={openNewModal} className="btn-primary">+ Nueva orden</button>
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
        {loading ? <Loading />
        : orders.length === 0 ? (
          <EmptyState
            icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25" /></svg>}
            title="No hay órdenes"
          />
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
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    {['PENDING', 'IN_PROGRESS', 'COMPLETED'].map(s => (
                      <button key={s} onClick={() => ordersApi.update({ id: o.id, status: s }).then(load)}
                        className={`w-6 h-6 rounded-md text-[10px] font-semibold transition-all ${o.status === s ? 'bg-white/[0.15] text-white' : 'bg-white/[0.04] text-white/20 hover:text-white/40 hover:bg-white/[0.08]'}`}>
                        {s === 'PENDING' ? 'P' : s === 'IN_PROGRESS' ? 'E' : 'C'}
                      </button>
                    ))}
                    <button onClick={() => { if(confirm('¿Eliminar orden?')) ordersApi.remove(o.id).then(load) }} className="w-6 h-6 rounded-md bg-white/[0.04] text-red-400/30 hover:bg-red-500/20 hover:text-red-400 transition-all text-[12px] leading-none">&times;</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {!isClient && (
        <Modal open={showNew} onClose={() => setShowNew(false)} title="Nueva orden de trabajo" wide>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Select label="Vehículo *" value={form.vehicle_id} onChange={(e) => setForm({ ...form, vehicle_id: e.target.value })} required className="bg-white/[0.06] text-white">
              <option value="">Seleccionar vehículo</option>
              {vehicles.map(v => <option key={v.id} value={v.id}>{v.plate} — {v.brand} {v.model}</option>)}
            </Select>

            <div>
              <label className="block text-[11px] font-medium text-white/40 uppercase tracking-wider mb-1.5">
                Descripción del problema
              </label>
              <div className="flex gap-2">
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3} placeholder="Describí el problema o servicio solicitado..."
                  className="input resize-none flex-1" />
                <div className="flex flex-col gap-1.5">
                  <button type="button" onClick={handleVoice}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${isListening ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-white/[0.06] text-white/30 hover:bg-white/[0.1] hover:text-white/50'}`}
                    title={isListening ? 'Detener grabación' : 'Dictar por voz'}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                    </svg>
                  </button>
                  <button type="button" onClick={handleAI} disabled={aiLoading || !form.description.trim()}
                    className="w-9 h-9 rounded-xl bg-violet-500/20 text-violet-400 flex items-center justify-center hover:bg-violet-500/30 transition-all disabled:opacity-30"
                    title="Mejorar con IA">
                    {aiLoading ? (
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              {isListening && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-[11px] text-red-400/60">Grabando... tocá el micrófono para detener</span>
                </div>
              )}
            </div>

            <Input label="Kilometraje actual" type="number" value={form.mileage} onChange={(e) => setForm({ ...form, mileage: e.target.value })} placeholder="120000" />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-white/40 uppercase tracking-wider">Servicios</span>
                <button type="button" onClick={addManualService}
                  className="text-[11px] text-sky-400/60 hover:text-sky-400 flex items-center gap-1 transition-colors">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                  Agregar servicio
                </button>
              </div>

              {manualServices.length > 0 && (
                <div className="space-y-1.5">
                  {manualServices.map((svc, i) => (
                    <div key={i} className="flex items-center gap-2 bg-white/[0.02] border border-white/[0.05] rounded-lg px-3 py-2">
                      <input type="text" value={svc.name} onChange={(e) => updateManualService(i, 'name', e.target.value)}
                        placeholder="Nombre del servicio"
                        className="flex-1 bg-transparent text-[13px] text-white/70 border-none outline-none placeholder-white/20 focus:text-white" />
                      <div className="flex items-center gap-1">
                        <span className="text-[11px] text-white/20">$</span>
                        <input type="number" value={svc.price} onChange={(e) => updateManualService(i, 'price', e.target.value)}
                          className="w-24 bg-white/[0.04] border border-white/[0.08] rounded-lg px-2 py-1 text-[13px] text-white/60 text-right font-mono outline-none focus:border-sky-500/30 focus:text-white" />
                      </div>
                      <button type="button" onClick={() => removeManualService(i)}
                        className="text-white/20 hover:text-red-400 transition-colors p-1">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {suggestedServices.length > 0 && (
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
                <div className="px-4 py-2.5 border-b border-white/[0.04]">
                  <span className="text-[11px] font-semibold text-violet-400/60 uppercase tracking-wider">
                    Servicios sugeridos por IA
                  </span>
                </div>
                <div className="divide-y divide-white/[0.03]">
                  {suggestedServices.map((svc, i) => (
                    <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                      <input type="checkbox" checked={svc.checked} onChange={(e) => updateService(i, 'checked', e.target.checked)}
                        className="w-4 h-4 rounded border-white/20 bg-white/[0.04] text-violet-500 focus:ring-violet-500/40 cursor-pointer accent-violet-500" />
                      <input type="text" value={svc.name} onChange={(e) => updateService(i, 'name', e.target.value)}
                        className="flex-1 bg-transparent text-[13px] text-white/70 border-none outline-none focus:text-white" />
                      <div className="flex items-center gap-1">
                        <span className="text-[11px] text-white/20">$</span>
                        <input type="number" value={svc.price} onChange={(e) => updateService(i, 'price', e.target.value)}
                          className="w-24 bg-white/[0.04] border border-white/[0.08] rounded-lg px-2 py-1 text-[13px] text-white/60 text-right font-mono outline-none focus:border-violet-500/30 focus:text-white" />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between px-4 py-2.5 bg-white/[0.02] border-t border-white/[0.04]">
                  <span className="text-[12px] text-white/30">
                    {suggestedServices.filter(s => s.checked).length} servicios seleccionados
                  </span>
                  <span className="text-[14px] font-bold text-white/70">{formatCurrency(totalServices)}</span>
                </div>
                <div className="px-4 py-2">
                  <button type="button" onClick={() => setSuggestedServices(suggestedServices.map(s => ({ ...s, checked: true })))}
                    className="text-[11px] text-violet-400/50 hover:text-violet-400 transition-colors mr-3">
                      Seleccionar todos
                  </button>
                  <button type="button" onClick={() => setSuggestedServices(suggestedServices.map(s => ({ ...s, checked: false })))}
                    className="text-[11px] text-white/20 hover:text-white/40 transition-colors">
                      Deseleccionar todos
                  </button>
                </div>
              </div>
            )}

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
