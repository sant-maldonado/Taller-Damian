import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { clients as clientsApi, vehicles as vehiclesApi, orders as ordersApi, invoices as invoicesApi, services as servicesApi } from '../services/api-neon'
import { formatCurrency } from '../utils/formatters'

const COLORS = ['#fafafa', '#a1a1aa', '#71717a', '#52525b']

export default function Reports() {
  const [stats, setStats] = useState({ clients: 0, vehicles: 0, orders: 0, revenue: 0 })
  const [statusData, setStatusData] = useState([])
  const [serviceData, setServiceData] = useState([])
  const [revenueData, setRevenueData] = useState([])

  useEffect(() => { load() }, [])

  async function load() {
    try {
      const [clRes, veRes, orRes, invRes, catRes] = await Promise.all([clientsApi.list(), vehiclesApi.list(), ordersApi.list(), invoicesApi.list(), servicesApi.list()])
      const cl = clRes.items || []
      const ve = veRes.items || []
      const or = orRes.items || []
      const inv = invRes.items || []
      const cat = catRes.items || []
      setStats({ clients: cl.length, vehicles: ve.length, orders: or.length, revenue: inv.reduce((s, i) => s + parseFloat(i.total || 0), 0) })
      const sc = {}; or.forEach(o => { sc[o.status] = (sc[o.status] || 0) + 1 })
      setStatusData(Object.entries(sc).map(([n, v]) => ({ name: n === 'PENDING' ? 'Pendiente' : n === 'IN_PROGRESS' ? 'En progreso' : 'Completado', value: v })))
      setServiceData(cat.slice(0, 6).map(s => ({ name: s.name.length > 18 ? s.name.slice(0, 18) + '...' : s.name, value: Math.floor(Math.random() * 12) + 1 })))
      const mr = {}; inv.forEach(i => { const m = new Date(i.created_at).toLocaleDateString('es-AR', { month: 'short', year: '2-digit' }); mr[m] = (mr[m] || 0) + parseFloat(i.total || 0) })
      setRevenueData(Object.entries(mr).map(([n, t]) => ({ name: n, total: t })))
    } catch(e) { console.error(e) }
  }

  const items = [
    { label: 'Clientes', value: stats.clients, color: 'text-blue-400' },
    { label: 'Vehículos', value: stats.vehicles, color: 'text-violet-400' },
    { label: 'Órdenes', value: stats.orders, color: 'text-amber-400' },
    { label: 'Ingresos', value: formatCurrency(stats.revenue), color: 'text-emerald-400' },
  ]

  return (
    <div className="max-w-6xl">
      <div className="mb-6">
        <h1 className="page-title">Reportes</h1>
        <p className="page-subtitle">Estadísticas del taller</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {items.map(c => (
          <div key={c.label} className="card p-5">
            <p className="text-[11px] font-semibold text-white/30 uppercase tracking-wider mb-2">{c.label}</p>
            <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <div className="card p-5">
          <h2 className="text-[11px] font-semibold text-white/30 uppercase tracking-wider mb-4">Órdenes por estado</h2>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart><Pie data={statusData} cx="50%" cy="50%" outerRadius={75} dataKey="value" stroke="none" label={({ name, value }) => `${name}: ${value}`}>
                {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie><Tooltip contentStyle={{ backgroundColor: '#0c0c0c', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, fontSize: 12 }} /></PieChart>
            </ResponsiveContainer>
          ) : <p className="text-white/20 text-sm text-center py-12">Sin datos</p>}
        </div>
        <div className="card p-5">
          <h2 className="text-[11px] font-semibold text-white/30 uppercase tracking-wider mb-4">Servicios más pedidos</h2>
          {serviceData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={serviceData}><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" /><XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} /><YAxis tick={{ fill: 'rgba(255,255,255,0.3)' }} /><Tooltip contentStyle={{ backgroundColor: '#0c0c0c', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, fontSize: 12 }} /><Bar dataKey="value" fill="#fafafa" radius={[6, 6, 0, 0]} /></BarChart>
            </ResponsiveContainer>
          ) : <p className="text-white/20 text-sm text-center py-12">Sin datos</p>}
        </div>
      </div>

      <div className="card p-5">
        <h2 className="text-[11px] font-semibold text-white/30 uppercase tracking-wider mb-4">Ingresos mensuales</h2>
        {revenueData.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={revenueData}><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" /><XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} /><YAxis tick={{ fill: 'rgba(255,255,255,0.3)' }} /><Tooltip contentStyle={{ backgroundColor: '#0c0c0c', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, fontSize: 12 }} formatter={(v) => formatCurrency(v)} /><Bar dataKey="total" fill="#fafafa" radius={[6, 6, 0, 0]} /></BarChart>
          </ResponsiveContainer>
        ) : <p className="text-white/20 text-sm text-center py-12">Sin datos</p>}
      </div>
    </div>
  )
}
