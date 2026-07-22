import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { clients as clientsApi, vehicles as vehiclesApi, orders as ordersApi, invoices as invoicesApi } from '../services/api-neon'
import { useAuth } from '../context/AuthContext'
import { formatCurrency, formatDate, getStatusLabel } from '../utils/formatters'
import { StatusBadge } from '../components/ui'

export default function Dashboard() {
  const { user } = useAuth()
  const isClient = user?.role === 'client'
  const [stats, setStats] = useState({ clients: 0, vehicles: 0, orders: 0, pending: 0, revenue: 0 })
  const [recentOrders, setRecentOrders] = useState([])
  const [myVehicles, setMyVehicles] = useState([])
  const [myInvoices, setMyInvoices] = useState([])

  useEffect(() => { load() }, [])

  async function load() {
    try {
      if (isClient) {
        const [vRes, oRes, invRes] = await Promise.all([
          vehiclesApi.list(), ordersApi.list(), invoicesApi.list()
        ])
        const v = vRes.items || []
        const o = oRes.items || []
        const inv = invRes.items || []
        setMyVehicles(v)
        setMyInvoices(inv.slice(0, 5))
        setStats({
          vehicles: v.length,
          orders: o.length,
          pending: o.filter(x => x.status !== 'COMPLETED').length,
        })
      } else {
        const [cRes, vRes, oRes, invRes] = await Promise.all([
          clientsApi.list(), vehiclesApi.list(), ordersApi.list(), invoicesApi.list()
        ])
        const o = oRes.items || []
        setRecentOrders(o.slice(0, 5))
        setStats({
          clients: cRes.total || 0, vehicles: vRes.total || 0, orders: oRes.total || 0,
          pending: o.filter(x => x.status === 'PENDING').length,
          revenue: (invRes.items || []).reduce((s, i) => s + parseFloat(i.total || 0), 0)
        })
      }
    } catch(e) { console.error(e) }
  }

  if (isClient) return <ClientDashboard user={user} stats={stats} vehicles={myVehicles} invoices={myInvoices} />

  const statCards = [
    { label: 'Clientes', href: '/clients', value: stats.clients, gradient: 'from-blue-500/20 to-blue-600/5', border: 'border-blue-500/20', text: 'text-blue-400', icon: 'M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z' },
    { label: 'Vehículos', href: '/vehicles', value: stats.vehicles, gradient: 'from-violet-500/20 to-violet-600/5', border: 'border-violet-500/20', text: 'text-violet-400', icon: 'M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.144-.506 1.144-1.125v-1.5c0-.621-.523-1.125-1.144-1.125H18.375m-5.25 0H5.625c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125h10.5M3.75 5.25h16.5' },
    { label: 'Órdenes', href: '/orders', value: stats.orders, gradient: 'from-amber-500/20 to-amber-600/5', border: 'border-amber-500/20', text: 'text-amber-400', icon: 'M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z' },
    { label: 'Pendientes', href: '/orders', value: stats.pending, gradient: 'from-rose-500/20 to-rose-600/5', border: 'border-rose-500/20', text: 'text-rose-400', icon: 'M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z' },
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
          <Link key={card.label} to={card.href} className={`card bg-gradient-to-br ${card.gradient} ${card.border} p-5 hover:scale-[1.02] transition-transform cursor-pointer`}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] font-semibold text-white/50 uppercase tracking-wider">{card.label}</span>
              <svg className={`w-5 h-5 ${card.text}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d={card.icon} />
              </svg>
            </div>
            <div className="text-3xl font-bold text-white tracking-tight">{card.value}</div>
          </Link>
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
                      {o.plate?.slice(0, 2) || '--'}
                    </div>
                    <div>
                      <div className="text-[13px] font-medium text-white">{o.plate || 'N/A'} · {o.brand}</div>
                    </div>
                  </div>
                  <StatusBadge status={o.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ClientDashboard({ user, stats, vehicles, invoices }) {
  return (
    <div className="max-w-6xl">
      <div className="mb-8">
        <h1 className="page-title">Hola, {user?.name?.split(' ')[0] || 'Cliente'}</h1>
        <p className="page-subtitle">Resumen de tu cuenta</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
        <Link to="/vehicles" className="card bg-gradient-to-br from-violet-500/20 to-violet-600/5 border border-violet-500/20 p-5 hover:border-violet-500/30 transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] font-semibold text-white/50 uppercase tracking-wider">Mis vehículos</span>
            <svg className="w-5 h-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.144-.506 1.144-1.125v-1.5c0-.621-.523-1.125-1.144-1.125H18.375m-5.25 0H5.625c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125h10.5M3.75 5.25h16.5" />
            </svg>
          </div>
          <div className="text-3xl font-bold text-white tracking-tight">{stats.vehicles}</div>
          <div className="text-[11px] text-white/30 mt-1">{stats.vehicles === 1 ? 'vehículo registrado' : 'vehículos registrados'}</div>
        </Link>

        <Link to="/invoices" className="card bg-gradient-to-br from-emerald-500/20 to-emerald-600/5 border border-emerald-500/20 p-5 hover:border-emerald-500/30 transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] font-semibold text-white/50 uppercase tracking-wider">Facturas</span>
            <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>
          <div className="text-3xl font-bold text-white tracking-tight">{invoices.length}</div>
          <div className="text-[11px] text-white/30 mt-1">{invoices.length === 1 ? 'factura' : 'facturas'}</div>
        </Link>

        <div className="card bg-gradient-to-br from-amber-500/20 to-amber-600/5 border border-amber-500/20 p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] font-semibold text-white/50 uppercase tracking-wider">Órdenes activas</span>
            <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-3xl font-bold text-white tracking-tight">{stats.pending}</div>
          <div className="text-[11px] text-white/30 mt-1">{stats.pending === 1 ? 'en curso' : 'en curso'}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider">Mis vehículos</h2>
            <Link to="/vehicles" className="text-[11px] text-white/30 hover:text-white/60 transition-colors">Ver todos</Link>
          </div>
          {vehicles.length === 0 ? (
            <div className="py-12 text-center text-white/20 text-sm">No tenés vehículos registrados</div>
          ) : (
            <div className="space-y-2">
              {vehicles.map(v => (
                <Link key={v.id} to="/vehicles"
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-violet-500/20 hover:bg-white/[0.04] transition-all group">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center text-[11px] font-bold text-violet-400 shrink-0">
                    {v.plate}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium text-white">{v.brand} {v.model}</div>
                    <div className="text-[11px] text-white/30">{v.year} · {v.color || 'Sin color'}</div>
                  </div>
                  <svg className="w-4 h-4 text-white/10 group-hover:text-white/30 transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider">Últimas facturas</h2>
            <Link to="/invoices" className="text-[11px] text-white/30 hover:text-white/60 transition-colors">Ver todas</Link>
          </div>
          {invoices.length === 0 ? (
            <div className="py-12 text-center text-white/20 text-sm">No tenés facturas aún</div>
          ) : (
            <div className="space-y-2">
              {invoices.map(inv => (
                <div key={inv.id} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-[11px] font-bold text-emerald-400 shrink-0">
                    #{String(inv.invoice_number).padStart(3, '0')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium text-white">{inv.orders?.vehicles?.plate || '—'}</div>
                    <div className="text-[11px] text-white/30">{formatDate(inv.created_at)}</div>
                  </div>
                  <div className="text-[14px] font-bold text-white shrink-0">{formatCurrency(inv.total)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Link to="/vehicles" className="card p-5 flex items-center gap-4 hover:border-violet-500/20 transition-all group">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center group-hover:bg-violet-500/20 transition-colors">
            <svg className="w-5 h-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.144-.506 1.144-1.125v-1.5c0-.621-.523-1.125-1.144-1.125H18.375m-5.25 0H5.625c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125h10.5M3.75 5.25h16.5" />
            </svg>
          </div>
          <div>
            <div className="text-[13px] font-medium text-white">Mis vehículos</div>
            <div className="text-[11px] text-white/30">Ver detalles y historial</div>
          </div>
        </Link>

        <Link to="/invoices" className="card p-5 flex items-center gap-4 hover:border-emerald-500/20 transition-all group">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
            <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>
          <div>
            <div className="text-[13px] font-medium text-white">Mis facturas</div>
            <div className="text-[11px] text-white/30">Descargar PDFs</div>
          </div>
        </Link>
      </div>
    </div>
  )
}
