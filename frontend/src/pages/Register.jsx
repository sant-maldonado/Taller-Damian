import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const [form, setForm] = useState({ name: '', dni: '', phone: '', email: '', password: '', plate: '', brand: '', model: '', year: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await register(form)
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
          <h1 className="text-2xl font-bold text-white mb-1">Taller Damian</h1>
          <p className="text-sm text-white/40">Crear cuenta de cliente</p>
        </div>

        <div className="card p-6">
          <h2 className="text-[15px] font-semibold text-white mb-5">Registrate</h2>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-2.5 rounded-xl text-[13px] mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-medium text-white/40 uppercase tracking-wider mb-1.5">Nombre completo</label>
              <input type="text" value={form.name} onChange={update('name')} className="input" placeholder="Juan Pérez" required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-medium text-white/40 uppercase tracking-wider mb-1.5">DNI</label>
                <input type="text" value={form.dni} onChange={update('dni')} className="input" placeholder="30123456" required />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-white/40 uppercase tracking-wider mb-1.5">Teléfono</label>
                <input type="text" value={form.phone} onChange={update('phone')} className="input" placeholder="11-1234-5678" required />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-white/40 uppercase tracking-wider mb-1.5">Email</label>
              <input type="email" value={form.email} onChange={update('email')} className="input" placeholder="juan@email.com" required />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-white/40 uppercase tracking-wider mb-1.5">Contraseña</label>
              <input type="password" value={form.password} onChange={update('password')} className="input" placeholder="Mínimo 6 caracteres" required minLength={6} />
            </div>

            <div className="border-t border-white/[0.06] pt-4 mt-4">
              <p className="text-[11px] text-white/30 mb-3 uppercase tracking-wider font-medium">Datos del vehículo</p>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-white/40 uppercase tracking-wider mb-1.5">Patente</label>
              <input type="text" value={form.plate} onChange={update('plate')} className="input" placeholder="ABC 123" required style={{ textTransform: 'uppercase' }} />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-medium text-white/40 uppercase tracking-wider mb-1.5">Marca</label>
                <input type="text" value={form.brand} onChange={update('brand')} className="input" placeholder="Toyota" />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-white/40 uppercase tracking-wider mb-1.5">Modelo</label>
                <input type="text" value={form.model} onChange={update('model')} className="input" placeholder="Corolla" />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-white/40 uppercase tracking-wider mb-1.5">Año</label>
                <input type="number" value={form.year} onChange={update('year')} className="input" placeholder="2020" min="1900" max="2099" />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <Link to="/login" className="text-[12px] text-white/30 hover:text-white/60 transition-colors">
              ¿Ya tenés cuenta? Iniciá sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
