import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const allItems = [
  { path: '/', label: 'Inicio', icon: 'M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6z' },
  { path: '/vehicles', label: 'Vehículos', icon: 'M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.144-.506 1.144-1.125v-1.5c0-.621-.523-1.125-1.144-1.125H18.375m-5.25 0H5.625c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125h10.5M3.75 5.25h16.5' },
  { path: '/orders', label: 'Órdenes', icon: 'M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z' },
  { path: '/invoices', label: 'Facturas', icon: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z' },
  { path: '/reports', label: 'Reportes', icon: 'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z' },
]

export default function BottomNav() {
  const location = useLocation()
  const { logout, user } = useAuth()

  const clientItems = [
    { path: '/', label: 'Inicio', icon: allItems[0].icon },
    { path: '/vehicles', label: 'Vehículos', icon: allItems[1].icon },
    { path: '/invoices', label: 'Facturas', icon: allItems[3].icon },
  ]

  const items = user?.role === 'client' ? clientItems : [
    { path: '/', label: 'Inicio', icon: allItems[0].icon },
    { path: '/orders', label: 'Órdenes', icon: allItems[2].icon },
    { path: '/clients', label: 'Clientes', icon: 'M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z' },
    { path: '/vehicles', label: 'Vehículos', icon: allItems[1].icon },
  ]

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#080808]/95 backdrop-blur-xl border-t border-white/[0.06]">
      <div className={`grid gap-0 ${user?.role === 'client' ? 'grid-cols-4' : 'grid-cols-5'}`}>
        {items.map(item => {
          const isActive = location.pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              className="flex flex-col items-center gap-1 py-2.5"
            >
              <svg
                className={`w-5 h-5 transition-colors ${isActive ? 'text-white' : 'text-white/30'}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
              </svg>
              <span className={`text-[10px] font-medium transition-colors ${isActive ? 'text-white' : 'text-white/30'}`}>
                {item.label}
              </span>
            </Link>
          )
        })}
        <button onClick={logout} className="flex flex-col items-center gap-1 py-2.5">
          <svg className="w-5 h-5 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
          </svg>
          <span className="text-[10px] font-medium text-white/30">Salir</span>
        </button>
      </div>
    </nav>
  )
}
