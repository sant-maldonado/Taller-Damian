import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { invoices as invoicesApi } from '../services/api-neon'
import { useAuth } from '../context/AuthContext'
import { formatDate } from '../utils/formatters'

export default function Invoices() {
  const { user } = useAuth()
  const isClient = user?.role === 'client'
  const navigate = useNavigate()
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  async function load() { try { setLoading(true); const res = await invoicesApi.list(); setInvoices(res.items || []) } catch(e) { console.error(e) } finally { setLoading(false) } }

  async function handlePdf(inv) {
    try {
      const { default: PDFDoc } = await import('pdfkit')
      const doc = new PDFDoc({ margin: 50 })
      const chunks = []
      doc.on('data', c => chunks.push(c))
      doc.on('end', () => {
        const blob = new Blob([Buffer.concat(chunks)], { type: 'application/pdf' })
        const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `factura-${String(inv.invoice_number).padStart(5, '0')}.pdf`; a.click(); URL.revokeObjectURL(url)
      })
      doc.fontSize(22).font('Helvetica-Bold').text('FACTURA', { align: 'center' }).moveDown(0.5)
      doc.fontSize(10).font('Helvetica').fillColor('#666')
      doc.text(`N° ${String(inv.invoice_number).padStart(5, '0')}`, { align: 'right' })
      doc.text(`Fecha: ${formatDate(inv.created_at)}`, { align: 'right' }).moveDown(1)
      doc.fillColor('#000').fontSize(12).font('Helvetica-Bold').text('Detalle').moveDown(0.3)
      doc.fontSize(10).font('Helvetica')
      doc.text(`Orden: ${inv.order_id || '-'}`).moveDown(0.8)
      doc.fontSize(13).font('Helvetica-Bold').text('TOTAL', 50, doc.y, { width: 260 })
      doc.text(`$${parseFloat(inv.total || 0).toLocaleString('es-AR')}`, 340, doc.y - 15, { width: 110, align: 'right' })
      doc.end()
    } catch(err) { alert('Error: ' + err.message) }
  }

  return (
    <div className="max-w-6xl">
      <div className="flex items-center gap-3 mb-6">
        {isClient && <button onClick={() => navigate('/')} className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center hover:bg-white/[0.1] transition-colors">
          <svg className="w-4 h-4 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
        </button>}
        <div>
          <h1 className="page-title">Facturas</h1>
          <p className="page-subtitle">{invoices.length} facturas emitidas</p>
        </div>
      </div>

      <div className="card overflow-hidden">
        {loading ? <div className="py-16 text-center text-white/30 text-sm">Cargando...</div>
        : invoices.length === 0 ? (
          <div className="py-16 text-center">
            <svg className="w-10 h-10 mx-auto mb-3 text-white/10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
            <p className="text-sm text-white/30">No hay facturas. Generá una desde una orden completada.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {invoices.map(inv => (
              <div key={inv.id} className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-[11px] font-bold text-emerald-400 shrink-0">
                  #{String(inv.invoice_number).padStart(3, '0')}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] text-white">{inv.orders?.vehicles?.clients?.name || 'Sin cliente'}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] text-white/25 font-mono">{inv.orders?.vehicles?.plate}</span>
                    <span className="text-[11px] text-white/10">·</span>
                    <span className="text-[11px] text-white/25">{formatDate(inv.created_at)}</span>
                  </div>
                </div>
                <div className="text-[15px] font-bold text-white mr-4">${parseFloat(inv.total).toLocaleString('es-AR')}</div>
                <button onClick={() => handlePdf(inv)} className="btn-secondary text-[12px]">
                  <svg className="w-3.5 h-3.5 mr-1.5 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                  PDF
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
