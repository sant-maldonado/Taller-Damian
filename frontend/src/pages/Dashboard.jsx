import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getClients, getVehicles, getOrders, getInvoices } from '../services/api'
import { seedAll, clearAll } from '../utils/seedData'

export default function Dashboard() {
  const [stats, setStats] = useState({ clients: 0, vehicles: 0, orders: 0, pending: 0, revenue: 0 })
  const [recentOrders, setRecentOrders] = useState([])

  useEffect(() => {
    async function init() {
      const c = await getClients()
      if (c.length === 0) seedAll()
      load()
    }
    init()
  }, [])

  async function load() {
    const [c, v, o, p, inv] = await Promise.all([
      getClients(), getVehicles(), getOrders(), getOrders('PENDING'), getInvoices()
    ])
    setStats({
      clients: c.length, vehicles: v.length, orders: o.length,
      pending: p.length, revenue: inv.reduce((s, i) => s + parseFloat(i.total), 0)
    })
    setRecentOrders(o.slice(0, 5))
  }

  function handleSeed() {
    seedAll()
    load()
  }

  function handleClear() {
    if (!confirm('¿Borrar todos los datos de ejemplo?')) return
    clearAll()
    window.location.reload()
  }

  const statCards = [
    { label: 'Clientes', value: stats.clients, gradient: 'from-blue-500/20 to-blue-600/5', border: 'border-blue-500/20', text: 'text-blue-400', icon: 'M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z' },
    { label: 'Vehículos', value: stats.vehicles, gradient: 'from-violet-500/20 to-violet-600/5', border: 'border-violet-500/20', text: 'text-violet-400', icon: 'M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.144-.506 1.144-1.125v-1.5c0-.621-.523-1.125-1.144-1.125H18.375m-5.25 0H5.625c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125h10.5M3.75 5.25h16.5' },
    { label: 'Órdenes', value: stats.orders, gradient: 'from-amber-500/20 to-amber-600/5', border: 'border-amber-500/20', text: 'text-amber-400', icon: 'M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z' },
    { label: 'Pendientes', value: stats.pending, gradient: 'from-rose-500/20 to-rose-600/5', border: 'border-rose-500/20', text: 'text-rose-400', icon: 'M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z' },
  ]

  const quickActions = [
    { label: 'Nueva orden de trabajo', href: '/orders', icon: 'M12 4.5v15m7.5-7.5h-15' },
    { label: 'Registrar cliente', href: '/clients', icon: 'M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z' },
    { label: 'Registrar vehículo', href: '/vehicles', icon: 'M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z' },
  ]

  return (
    <div className="max-w-6xl">
      <div className="mb-8">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Resumen general del taller</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {statCards.map((card) => (
          <div key={card.label} className={`card bg-gradient-to-br ${card.gradient} ${card.border} p-5`}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] font-semibold text-white/50 uppercase tracking-wider">{card.label}</span>
              <svg className={`w-5 h-5 ${card.text}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d={card.icon} />
              </svg>
            </div>
            <div className="text-3xl font-bold text-white tracking-tight">{card.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="card p-6 lg:col-span-1">
          <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-4">Acciones rápidas</h2>
          <div className="space-y-2">
            {quickActions.map((action) => (
              <Link key={action.label} to={action.href}
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.05] hover:border-white/[0.1] hover:bg-white/[0.06] transition-all duration-200 group">
                <div className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center group-hover:bg-white/[0.1] transition-colors">
                  <svg className="w-4 h-4 text-white/40 group-hover:text-white/70 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={action.icon} />
                  </svg>
                </div>
                <span className="text-[13px] text-white/60 group-hover:text-white/90 transition-colors">{action.label}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="card p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider">Últimas órdenes</h2>
            <Link to="/orders" className="text-[11px] text-white/30 hover:text-white/60 transition-colors">Ver todas</Link>
          </div>
          {recentOrders.length === 0 ? (
            <div className="py-12 text-center text-white/20 text-sm">No hay órdenes aún</div>
          ) : (
            <div className="space-y-2">
              {recentOrders.map((o) => (
                <div key={o.id} className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center text-[11px] font-bold text-white/40">
                      {o.vehicles?.plate?.slice(0, 2)}
                    </div>
                    <div>
                      <div className="text-[13px] font-medium text-white">{o.vehicles?.plate} · {o.vehicles?.brand}</div>
                      <div className="text-[11px] text-white/30">{o.vehicles?.clients?.name || 'Sin cliente'}</div>
                    </div>
                  </div>
                  <span className={`badge text-[10px] ${
                    o.status === 'PENDING' ? 'bg-amber-500/10 text-amber-400' :
                    o.status === 'IN_PROGRESS' ? 'bg-sky-500/10 text-sky-400' :
                    'bg-emerald-500/10 text-emerald-400'
                  }`}>
                    {o.status === 'PENDING' ? 'Pendiente' : o.status === 'IN_PROGRESS' ? 'En progreso' : 'Completado'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[13px] font-semibold text-white/60">Datos de ejemplo</h2>
            <p className="text-[11px] text-white/30 mt-0.5">Se cargan automáticamente al abrir la app por primera vez</p>
          </div>
          <div className="flex gap-2">
            <button onClick={handleClear} className="btn-ghost text-red-400/50 hover:text-red-400 text-[12px]">Limpiar todo</button>
            <button onClick={handleSeed} className="btn-primary text-[12px]">Recargar ejemplos</button>
          </div>
        </div>
      </div>
    </div>
  )
}
