import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { auth } from '../services/api-neon'

export default function Account() {
  const { user } = useAuth()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    if (newPassword.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres')
      return
    }

    setLoading(true)
    try {
      await auth.changePassword({ current_password: currentPassword, new_password: newPassword })
      setSuccess('Contraseña actualizada correctamente')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const ROLE_LABELS = { admin: 'Administrador', manager: 'Gerente', mechanic: 'Mecánico', client: 'Cliente', viewer: 'Observador' }

  return (
    <div className="max-w-2xl">
      <h1 className="page-title">Mi cuenta</h1>
      <p className="page-subtitle">Gestioná tu perfil y contraseña</p>

      <div className="card p-6 mt-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-white/[0.06] border border-white/[0.06] flex items-center justify-center text-lg font-bold text-white/40">
            {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="text-[15px] font-medium text-white">{user?.name}</div>
            <div className="text-[12px] text-white/30">{user?.email}</div>
            <div className="text-[11px] text-white/20 mt-0.5">{ROLE_LABELS[user?.role] || user?.role}</div>
          </div>
        </div>

        <div className="border-t border-white/[0.06] pt-5">
          <h2 className="text-[13px] font-semibold text-white mb-4">Cambiar contraseña</h2>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-2.5 rounded-xl text-[13px] mb-4">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-2.5 rounded-xl text-[13px] mb-4">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-medium text-white/40 uppercase tracking-wider mb-1.5">Contraseña actual</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="input"
                placeholder="••••••••"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-white/40 uppercase tracking-wider mb-1.5">Nueva contraseña</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="input"
                placeholder="Mínimo 6 caracteres"
                required
                minLength={6}
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-white/40 uppercase tracking-wider mb-1.5">Confirmar nueva contraseña</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input"
                placeholder="Repetí la contraseña"
                required
                minLength={6}
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Guardando...' : 'Actualizar contraseña'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
