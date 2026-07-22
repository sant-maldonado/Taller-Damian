import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { vehicles as vehiclesApi, groq as groqApi, services as servicesApi, orders as ordersApi } from '../services/api-neon'
import { useAuth } from '../context/AuthContext'
import { StatusBadge, EmptyState } from '../components/ui'
import { formatDate, formatCurrency, formatHours, getStatusLabel, engineLabel, transLabel } from '../utils/formatters'
import Loading from '../components/Loading'

export default function VehicleDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const isClient = user?.role === 'client'
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [datePreset, setDatePreset] = useState('')
  const [showChat, setShowChat] = useState(false)
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [suggestedOrder, setSuggestedOrder] = useState(null)
  const chatEndRef = useRef(null)
  const chatInputRef = useRef(null)
  const [catalog, setCatalog] = useState([])

  useEffect(() => { load() }, [id])

  async function load() {
    try {
      setLoading(true)
      const res = await vehiclesApi.history(id)
      setData(res)
      try { const cat = await servicesApi.list(); setCatalog(cat.items || []) } catch {}
    } catch(e) { console.error(e) } finally { setLoading(false) }
  }

  useEffect(() => {
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  useEffect(() => {
    if (showChat && chatInputRef.current) chatInputRef.current.focus()
  }, [showChat])

  async function sendChatMessage() {
    if (!chatInput.trim() || chatLoading) return
    const msg = chatInput.trim()
    setChatInput('')
    setChatMessages(prev => [...prev, { role: 'user', content: msg }])
    setChatLoading(true)
    setSuggestedOrder(null)

    try {
      const vehicleContext = data?.vehicle ? {
        brand: data.vehicle.brand,
        model: data.vehicle.model,
        year: data.vehicle.year,
        plate: data.vehicle.plate,
        engine_type: data.vehicle.engine_type,
        transmission: data.vehicle.transmission,
        current_km: data.vehicle.current_km,
      } : null

      const res = await groqApi.chat({ message: msg, vehicleContext, catalog })
      setChatMessages(prev => [...prev, { role: 'assistant', content: res }])

      if (res.services && res.services.length > 0) {
        setSuggestedOrder(res)
      }
    } catch(err) {
      setChatMessages(prev => [...prev, { role: 'assistant', content: { description: 'Error: ' + err.message, services: [], notes: '' } }])
    } finally {
      setChatLoading(false)
    }
  }

  async function createOrderFromSuggestion() {
    if (!suggestedOrder || !data?.vehicle) return
    try {
      const order = await ordersApi.create({
        vehicle_id: data.vehicle.id,
        status: 'COMPLETED',
        description: suggestedOrder.description,
        mileage: suggestedOrder.mileage || data.vehicle.current_km,
        notes: suggestedOrder.notes,
      })

      for (const svc of suggestedOrder.services) {
        await servicesApi.create({
          order_id: order.id,
          name: svc.name,
          price: svc.price,
          notes: svc.category,
        })
      }

      setSuggestedOrder(null)
      setChatMessages([])
      setShowChat(false)
      load()
    } catch(err) {
      alert('Error al crear orden: ' + err.message)
    }
  }

  if (loading) return <div className="max-w-6xl"><Loading /></div>
  if (!data) return <div className="max-w-6xl"><EmptyState icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" /></svg>} title="Vehículo no encontrado" description="El vehículo no existe o no tenés acceso" /></div>

  const { vehicle, orders } = data
  const filteredOrders = orders.filter(o => {
    if (statusFilter && o.status !== statusFilter) return false
    if (dateFrom || dateTo) {
      const d = new Date(o.created_at)
      if (dateFrom && d < new Date(dateFrom + 'T00:00:00')) return false
      if (dateTo) { const to = new Date(dateTo + 'T23:59:59'); if (d > to) return false }
    }
    return true
  })

  const totalSpent = orders.reduce((sum, o) => {
    if (o.invoices?.[0]?.total) return sum + parseFloat(o.invoices[0].total)
    return sum + (o.services || []).reduce((s, svc) => s + parseFloat(svc.price || 0), 0)
  }, 0)

  const orderWithKm = orders.filter(o => o.mileage != null).sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  const latestKm = orderWithKm[0]?.mileage || null
  const prevKm = orderWithKm[1]?.mileage || null
  const kmDiff = latestKm && prevKm ? latestKm - prevKm : null

  const tabs = [
    { key: '', label: 'Todas', count: orders.length },
    { key: 'PENDING', label: 'Pendientes', count: orders.filter(o => o.status === 'PENDING').length },
    { key: 'IN_PROGRESS', label: 'En progreso', count: orders.filter(o => o.status === 'IN_PROGRESS').length },
    { key: 'COMPLETED', label: 'Completadas', count: orders.filter(o => o.status === 'COMPLETED').length },
  ]

  const datePresets = [
    { key: '', label: 'Todo' },
    { key: '1m', label: 'Último mes' },
    { key: '3m', label: 'Últimos 3 meses' },
    { key: '6m', label: 'Últimos 6 meses' },
    { key: '1y', label: 'Este año' },
    { key: 'custom', label: 'Rango' },
  ]

  function applyPreset(key) {
    setDatePreset(key)
    const now = new Date()
    const fmt = d => d.toISOString().split('T')[0]
    if (key === '') { setDateFrom(''); setDateTo(''); return }
    let from
    if (key === '1m') { from = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()) }
    else if (key === '3m') { from = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate()) }
    else if (key === '6m') { from = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate()) }
    else if (key === '1y') { from = new Date(now.getFullYear(), 0, 1) }
    else { return }
    setDateFrom(fmt(from))
    setDateTo(fmt(now))
  }

  const activeDateLabel = datePresets.find(p => p.key === datePreset)?.label || ''

  async function exportPDF() {
    const [{ default: jsPDF }, autotableModule] = await Promise.all([
      import('jspdf'),
      import('jspdf-autotable')
    ])
    autotableModule.applyPlugin(jsPDF)
    const doc = new jsPDF()
    const pdfOrders = filteredOrders
    const hasDateFilter = dateFrom || dateTo
    const filteredTotal = pdfOrders.reduce((sum, o) => {
      if (o.invoices?.[0]?.total) return sum + parseFloat(o.invoices[0].total)
      return sum + (o.services || []).reduce((s, svc) => s + parseFloat(svc.price || 0), 0)
    }, 0)

    let y = 20
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text(`Historial: ${vehicle.brand} ${vehicle.model}`, 14, y)
    y += 8
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(120)
    doc.text(`Patente: ${vehicle.plate}  |  Ano: ${vehicle.year}  |  VIN: ${vehicle.vin || '—'}`, 14, y)
    y += 6
    doc.text(`Kilometraje actual: ${vehicle.current_km?.toLocaleString() || '—'} km  |  Motor: ${engineLabel(vehicle.engine_type)}  |  Transmision: ${transLabel(vehicle.transmission)}`, 14, y)
    y += 6
    doc.text(`Dueno: ${vehicle.client_name || '—'}  |  Total: $${filteredTotal.toLocaleString('es-AR')}${hasDateFilter ? '' : ' (historial completo)'}`, 14, y)
    y += 6
    if (hasDateFilter) {
      doc.setTextColor(80)
      doc.text(`Periodo: ${dateFrom ? formatDate(dateFrom) : 'Inicio'} — ${dateTo ? formatDate(dateTo) : 'Fin'}  |  ${pdfOrders.length} ordenes`, 14, y)
      y += 6
    }
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0)
    doc.text('Ordenes de servicio', 14, y)
    y += 2
    const rows = pdfOrders.map(o => {
      const servicesList = (o.services || []).map(s => s.name).join(', ') || '—'
      const total = o.invoices?.[0]?.total ? parseFloat(o.invoices[0].total) : (o.services || []).reduce((s, svc) => s + parseFloat(svc.price || 0), 0)
      return [formatDate(o.created_at), getStatusLabel(o.status), o.mileage ? `${o.mileage.toLocaleString()} km` : '—', servicesList.substring(0, 40), `$${total.toLocaleString('es-AR')}`]
    })
    doc.autoTable({ startY: y, head: [['Fecha', 'Estado', 'Km', 'Servicios', 'Total']], body: rows, styles: { fontSize: 8, cellPadding: 3 }, headStyles: { fillColor: [41, 65, 122] }, alternateRowStyles: { fillColor: [240, 243, 250] }, margin: { left: 14, right: 14 } })
    const filename = hasDateFilter
      ? `historial-${vehicle.plate}_${dateFrom || 'inicio'}_${dateTo || 'fin'}.pdf`
      : `historial-${vehicle.plate}.pdf`
    doc.save(filename)
  }

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/vehicles')} className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center hover:bg-white/[0.1] transition-colors">
            <svg className="w-4 h-4 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
          </button>
          <div>
            <h1 className="page-title">{vehicle.brand} {vehicle.model}</h1>
            <p className="page-subtitle">{vehicle.plate} · {vehicle.year}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isClient && (
            <button onClick={() => { setShowChat(!showChat); if (!showChat) { setChatMessages([]); setSuggestedOrder(null) } }}
              className={`text-sm flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all ${showChat ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30' : 'btn-secondary'}`}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>
              <span className="hidden sm:inline">Asistente IA</span>
            </button>
          )}
          <button onClick={exportPDF} className="btn-secondary text-sm">
            <svg className="w-4 h-4 sm:mr-1.5 sm:inline hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
            PDF
          </button>
        </div>
      </div>

      {showChat && !isClient && (
        <div className="card p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-md bg-violet-500/10 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>
            </div>
            <span className="text-[12px] font-semibold text-violet-400/60 uppercase tracking-wider">Asistente de registro</span>
          </div>

          <div className="h-[300px] overflow-y-auto mb-3 space-y-3 pr-2">
            {chatMessages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-12 h-12 rounded-2xl bg-violet-500/10 flex items-center justify-center mb-3">
                  <svg className="w-6 h-6 text-violet-400/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>
                </div>
                <p className="text-sm text-white/40 mb-1">Describí lo que le hiciste al auto</p>
                <p className="text-xs text-white/20">Ej: "Le cambié el aceite y el filtro, y le revisé los frenos"</p>
              </div>
            )}

            {chatMessages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${m.role === 'user' ? 'bg-white/[0.08] text-white/80' : 'bg-violet-500/[0.08] border border-violet-500/10'}`}>
                  {m.role === 'user' ? (
                    <p className="text-sm">{m.content}</p>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm text-white/70">{m.content.description}</p>
                      {m.content.services?.length > 0 && (
                        <div className="space-y-1">
                          {m.content.services.map((s, j) => (
                            <div key={j} className="flex items-center justify-between text-xs bg-white/[0.03] rounded-lg px-2.5 py-1.5">
                              <span className="text-white/50">{s.name}</span>
                              <span className="text-white/30 font-mono">{formatCurrency(s.price)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {m.content.notes && (
                        <p className="text-xs text-white/30 italic">{m.content.notes}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-violet-500/[0.08] border border-violet-500/10 rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-violet-400/50 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 rounded-full bg-violet-400/50 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 rounded-full bg-violet-400/50 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {suggestedOrder && (
            <div className="mb-3 p-3 bg-emerald-500/[0.06] border border-emerald-500/15 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-emerald-400/60 uppercase tracking-wider">Orden sugerida</span>
                <span className="text-xs text-emerald-400/40">{suggestedOrder.services?.length || 0} servicios · {formatCurrency(suggestedOrder.services?.reduce((s, svc) => s + parseFloat(svc.price || 0), 0) || 0)}</span>
              </div>
              <button onClick={createOrderFromSuggestion} className="w-full btn-primary text-sm flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                Crear orden con estos datos
              </button>
            </div>
          )}

          <div className="flex items-center gap-2">
            <input ref={chatInputRef} type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendChatMessage()}
              placeholder="Ej: Cambié el aceite y los frenos delanteros..."
              className="input flex-1" disabled={chatLoading} />
            <button onClick={sendChatMessage} disabled={!chatInput.trim() || chatLoading}
              className="w-10 h-10 rounded-xl bg-violet-500/20 text-violet-400 flex items-center justify-center hover:bg-violet-500/30 transition-colors disabled:opacity-30">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center text-lg font-bold shrink-0">
              {vehicle.brand?.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-lg font-bold text-white font-mono">{vehicle.plate}</span>
                <span className="text-white/20">·</span>
                <span className="text-white/50">{vehicle.brand} {vehicle.model} {vehicle.year}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <div>
                  <div className="text-[11px] text-white/30 uppercase tracking-wider">Color</div>
                  <div className="text-white/60">{vehicle.color || '—'}</div>
                </div>
                <div>
                  <div className="text-[11px] text-white/30 uppercase tracking-wider">VIN</div>
                  <div className="text-white/60 font-mono text-xs">{vehicle.vin || '—'}</div>
                </div>
                <div>
                  <div className="text-[11px] text-white/30 uppercase tracking-wider">Motor</div>
                  <div className="text-white/60">{engineLabel(vehicle.engine_type)}</div>
                </div>
                <div>
                  <div className="text-[11px] text-white/30 uppercase tracking-wider">Transmision</div>
                  <div className="text-white/60">{transLabel(vehicle.transmission)}</div>
                </div>
              </div>
              <div className="mt-2 text-sm">
                <span className="text-[11px] text-white/30 uppercase tracking-wider">Dueno: </span>
                <span className="text-white/60">{vehicle.client_name || '—'}</span>
                {vehicle.client_phone && <span className="text-white/30 ml-2">· {vehicle.client_phone}</span>}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="card p-4">
            <div className="text-[11px] text-white/30 uppercase tracking-wider mb-1">Kilometraje actual</div>
            <div className="text-xl font-bold text-white">{vehicle.current_km != null ? `${vehicle.current_km.toLocaleString()} km` : '—'}</div>
            {kmDiff !== null && (
              <div className={`text-xs mt-1 ${kmDiff < 0 ? 'text-red-400' : kmDiff > 50000 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {kmDiff < 0 ? 'Kilometraje menor al anterior' : kmDiff > 50000 ? `Salto de ${kmDiff.toLocaleString()} km` : `+${kmDiff.toLocaleString()} km desde ultima visita`}
              </div>
            )}
          </div>
          <div className="card p-4">
            <div className="text-[11px] text-white/30 uppercase tracking-wider mb-1">Total historial</div>
            <div className="text-xl font-bold text-white">{formatCurrency(totalSpent)}</div>
            <div className="text-xs text-white/30 mt-1">{orders.length} ordenes registradas</div>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center gap-1 p-1 bg-white/[0.03] rounded-xl w-fit flex-wrap">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setStatusFilter(t.key)}
              className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-all ${statusFilter === t.key ? 'bg-white/[0.1] text-white shadow-sm' : 'text-white/30 hover:text-white/50'}`}>
              {t.label}{t.count > 0 && <span className="ml-1.5 text-[10px] opacity-50">{t.count}</span>}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <div className="flex items-center gap-1 p-1 bg-white/[0.03] rounded-xl">
            {datePresets.map(p => (
              <button key={p.key} onClick={() => applyPreset(p.key)}
                className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all ${datePreset === p.key ? 'bg-white/[0.1] text-white shadow-sm' : 'text-white/30 hover:text-white/50'}`}>
                {p.label}
              </button>
            ))}
          </div>
          {datePreset === 'custom' && (
            <div className="flex items-center gap-2 animate-in fade-in duration-150">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-white/25 uppercase tracking-wider">Desde</span>
                <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                  className="input !py-1 !px-2 !text-[12px] !w-[140px]" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-white/25 uppercase tracking-wider">Hasta</span>
                <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                  className="input !py-1 !px-2 !text-[12px] !w-[140px]" />
              </div>
            </div>
          )}
        </div>

        {datePreset && (
          <div className="flex items-center gap-2 mt-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/[0.04] text-white/40 text-[11px] rounded-lg">
              <svg className="w-3 h-3 text-white/25" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>
              {activeDateLabel}
              {dateFrom && dateTo && datePreset === 'custom' && (
                <span className="text-white/20 ml-0.5">{formatDate(dateFrom)} — {formatDate(dateTo)}</span>
              )}
            </span>
            <button onClick={() => applyPreset('')}
              className="text-[11px] text-white/20 hover:text-white/40 flex items-center gap-0.5 px-1.5 py-1 rounded-md hover:bg-white/[0.04] transition-colors">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              Limpiar
            </button>
          </div>
        )}
      </div>

      {filteredOrders.length === 0 ? (
        <EmptyState
          icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" /></svg>}
          title="Sin ordenes"
          description={statusFilter ? "No hay ordenes con este estado" : "Este vehiculo no tiene ordenes registradas"}
        />
      ) : (() => {
        const completed = filteredOrders.filter(o => o.status === 'COMPLETED')
        const others = filteredOrders.filter(o => o.status !== 'COMPLETED')

        return (
          <div className="space-y-6">
            {others.length > 0 && (
              <div className="space-y-3">
                {others.map(o => {
                  const orderTotal = o.invoices?.[0]?.total
                    ? parseFloat(o.invoices[0].total)
                    : (o.services || []).reduce((s, svc) => s + parseFloat(svc.price || 0), 0)
                  return (
                    <div key={o.id} className="card p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <StatusBadge status={o.status} />
                        <span className="text-sm text-white/50">{formatDate(o.created_at)}</span>
                        {o.mileage != null && <span className="text-xs text-white/30 bg-white/[0.04] px-2 py-0.5 rounded-lg">{o.mileage.toLocaleString()} km</span>}
                      </div>
                      {o.description && <p className="text-sm text-white/60 mb-2">{o.description}</p>}
                      {o.services && o.services.length > 0 && (
                        <div className="space-y-1 mb-2">
                          {o.services.map((s, i) => (
                            <div key={i} className="flex items-center justify-between text-sm bg-white/[0.02] rounded-lg px-3 py-1.5">
                              <span className="text-white/60">{s.name}</span>
                              <span className="text-white/40 font-mono">{formatCurrency(s.price)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center justify-between text-xs text-white/30">
                        <span>{o.notes || ''}</span>
                        <span className="font-semibold text-white/50">{formatCurrency(orderTotal)}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {completed.length > 0 && (
              <div>
                {others.length > 0 && (
                  <div className="flex items-center gap-2 mb-4">
                    <div className="text-[11px] font-semibold text-emerald-400/60 uppercase tracking-wider">Historial completado</div>
                    <div className="flex-1 h-px bg-emerald-500/10" />
                  </div>
                )}

                <div className="relative pl-6">
                  <div className="absolute left-[11px] top-3 bottom-3 w-px bg-emerald-500/15" />

                  <div className="space-y-0">
                    {completed.map((o, idx) => {
                      const orderTotal = o.invoices?.[0]?.total
                        ? parseFloat(o.invoices[0].total)
                        : (o.services || []).reduce((s, svc) => s + parseFloat(svc.price || 0), 0)
                      const totalHours = (o.hours || []).reduce((s, h) => s + parseFloat(h.hours || 0), 0)
                      const isLast = idx === completed.length - 1

                      return (
                        <div key={o.id} className="relative pb-6 last:pb-0">
                          <div className={`absolute left-[-13px] top-[6px] w-[9px] h-[9px] rounded-full border-2 border-emerald-500/40 ${isLast ? 'bg-emerald-400' : 'bg-emerald-500/20'}`} />

                          <div className="ml-2">
                            <div className="flex items-baseline gap-3 mb-1.5">
                              <span className="text-xs text-white/30 font-mono whitespace-nowrap">{formatDate(o.created_at)}</span>
                              {o.mileage != null && (
                                <span className="text-[11px] text-white/20">{o.mileage.toLocaleString()} km</span>
                              )}
                            </div>

                            {o.description && <p className="text-sm text-white/60 mb-2 leading-snug">{o.description}</p>}

                            {o.services && o.services.length > 0 && (
                              <div className="space-y-0.5 mb-2">
                                {o.services.map((s, i) => (
                                  <div key={i} className="flex items-center justify-between text-[13px]">
                                    <span className="text-white/50 flex items-center gap-1.5">
                                      <span className="w-1 h-1 rounded-full bg-emerald-500/30 shrink-0" />
                                      {s.name}
                                    </span>
                                    <span className="text-white/30 font-mono text-xs">{formatCurrency(s.price)}</span>
                                  </div>
                                ))}
                              </div>
                            )}

                            <div className="flex items-center gap-3 flex-wrap">
                              <span className="text-sm font-semibold text-white/60">{formatCurrency(orderTotal)}</span>
                              {totalHours > 0 && (
                                <span className="text-[11px] text-white/25 flex items-center gap-1">
                                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                  {formatHours(totalHours)}
                                </span>
                              )}
                              {o.invoices && o.invoices.length > 0 && o.invoices[0].id && (
                                <span className="text-[11px] text-white/25 flex items-center gap-1">
                                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                                  #{o.invoices[0].invoice_number}
                                </span>
                              )}
                            </div>

                            {o.notes && (
                              <p className="text-[11px] text-white/20 mt-1.5 italic leading-snug">{o.notes}</p>
                            )}

                            {o.photos && o.photos.length > 0 && (
                              <div className="flex gap-1.5 mt-2">
                                {o.photos.map((p, i) => (
                                  <img key={i} src={p.url} alt={p.caption || ''} className="w-12 h-12 rounded-lg object-cover border border-white/[0.06]" />
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      })()}
    </div>
  )
}
