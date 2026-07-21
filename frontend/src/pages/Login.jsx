import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(identifier, password)
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-white/10">
            <svg className="w-8 h-8 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17l-5.384 5.384a2.025 2.025 0 01-2.864-2.864l5.384-5.384m2.864 2.864L17.5 9.5" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">Taller Mecánico</h1>
          <p className="text-sm text-white/40">Sistema de gestión</p>
        </div>

        <div className="card p-6">
          <h2 className="text-[15px] font-semibold text-white mb-5">Iniciar sesión</h2>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-2.5 rounded-xl text-[13px] mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-medium text-white/40 uppercase tracking-wider mb-1.5">Email o DNI</label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="input"
                placeholder="30123456"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-white/40 uppercase tracking-wider mb-1.5">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <p className="text-[11px] text-white/25 mt-4 text-center">Clientes: ingresá tu DNI o patente del vehículo</p>

          <div className="mt-3 text-center">
            <Link to="/register" className="text-[12px] text-white/30 hover:text-white/60 transition-colors">
              ¿No tenés cuenta? Crear una
            </Link>
          </div>
        </div>

        <p className="text-center text-[11px] text-white/15 mt-6">Admin: admin@taller.com / admin123</p>
      </div>
    </div>
  )
}
