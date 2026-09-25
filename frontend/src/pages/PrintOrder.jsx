import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { orders as ordersApi } from '../services/api-neon'
import { formatDate, formatCurrency, getStatusLabel } from '../utils/formatters'

export default function PrintOrder() {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    (async () => {
      try {
        setLoading(true)
        setError('')
        const res = await ordersApi.detail(orderId)
        setOrder(res)
      } catch (e) {
        setError(e.message || 'No se pudo cargar el trabajo')
      } finally {
        setLoading(false)
      }
    })()
  }, [orderId])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="text-white/30 text-sm">Cargando...</div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center gap-4 px-6">
        <p className="text-white/50 text-sm">{error || 'Trabajo no encontrado'}</p>
        <button onClick={() => navigate(-1)} className="btn-secondary text-sm">Volver</button>
      </div>
    )
  }

  const total = order.invoices?.[0]?.total
    ? parseFloat(order.invoices[0].total)
    : (order.services || []).reduce((s, svc) => s + parseFloat(svc.price || 0), 0)
  const invoice = order.invoices?.[0]
  const services = order.services || []

  return (
    <div className="min-h-screen bg-[#050505] py-6 px-4 flex flex-col items-center">
      <div className="w-full max-w-md no-print flex items-center justify-between mb-4">
        <button onClick={() => navigate(-1)} className="btn-secondary text-sm">Volver</button>
        <button
          onClick={() => window.print()}
          className="px-4 py-2.5 bg-white text-black text-sm font-semibold rounded-xl hover:bg-white/90 transition-colors"
        >
          Imprimir / PDF
        </button>
      </div>

      <div className="print-area w-full max-w-md bg-white text-black rounded-2xl p-6">
        <div className="flex items-center justify-between border-b-2 border-black pb-3 mb-4">
          <div>
            <div className="text-xl font-extrabold tracking-tight">TALLER DAMIAN</div>
            <div className="text-[11px] text-neutral-500">Mecánica general y mantenimiento</div>
          </div>
          <div className="text-right">
            <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">Comprobante</div>
            <div className="text-xs">{invoice ? `N° ${invoice.invoice_number}` : 'Trabajo N° ' + orderId}</div>
          </div>
        </div>

        <div className="text-[11px] text-neutral-500 mb-4">
          <div className="flex justify-between py-0.5"><span>Fecha</span><span className="font-semibold text-black">{formatDate(order.created_at)}</span></div>
          <div className="flex justify-between py-0.5"><span>Estado</span><span className="font-semibold text-black">{getStatusLabel(order.status)}</span></div>
          {order.mileage != null && (
            <div className="flex justify-between py-0.5"><span>Kilometraje</span><span className="font-semibold text-black">{order.mileage.toLocaleString()} km</span></div>
          )}
        </div>

        <div className="text-[11px] border border-black/20 rounded-lg p-3 mb-4">
          <div className="font-bold uppercase tracking-wider text-neutral-500 mb-1">Vehículo</div>
          <div className="text-sm font-bold">{order.brand} {order.model} <span className="font-mono">({order.plate})</span></div>
          {order.year ? <div className="text-xs text-neutral-600">{order.year}</div> : null}
          {order.client_name && (
            <div className="text-xs text-neutral-600 mt-1">
              {order.client_name}
              {order.client_phone && <span className="ml-1">· {order.client_phone}</span>}
              {order.client_dni && <span className="ml-1">· DNI {order.client_dni}</span>}
            </div>
          )}
        </div>

        {order.description && (
          <div className="text-[13px] mb-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 mb-0.5">Descripción</div>
            {order.description}
          </div>
        )}

        {services.length > 0 && (
          <div className="mb-4">
            <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 mb-1">Servicios</div>
            <div className="border border-black/20 rounded-lg divide-y divide-black/10">
              {services.map((s, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-1.5 text-[13px]">
                  <span className="pr-2">{s.name}</span>
                  <span className="font-semibold whitespace-nowrap">{formatCurrency(s.price)}</span>
                </div>
              ))}
              <div className="flex items-center justify-between px-3 py-2 text-sm font-extrabold bg-neutral-100">
                <span>TOTAL</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
          </div>
        )}

        {order.notes && (
          <div className="text-xs text-neutral-600 mb-4">
            <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 mb-0.5">Notas</div>
            {order.notes}
          </div>
        )}

        <div className="border-t border-black/20 pt-4 flex items-center justify-between text-[11px] text-neutral-500">
          <span>¡Gracias por confiar en Taller Damian!</span>
          {invoice && <span className="font-semibold text-black">Abonado: {formatCurrency(invoice.total)}</span>}
        </div>
      </div>
    </div>
  )
}