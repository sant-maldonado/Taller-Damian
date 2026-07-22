export function Input({ label, className = '', ...props }) {
  return (
    <div>
      {label && <label className="block text-[11px] font-medium text-white/40 uppercase tracking-wider mb-1.5">{label}</label>}
      <input className={`input ${className}`} {...props} />
    </div>
  )
}

export function Select({ label, children, className = '', ...props }) {
  return (
    <div>
      {label && <label className="block text-[11px] font-medium text-white/40 uppercase tracking-wider mb-1.5">{label}</label>}
      <select className={`input ${className}`} {...props}>{children}</select>
    </div>
  )
}

export function Textarea({ label, className = '', ...props }) {
  return (
    <div>
      {label && <label className="block text-[11px] font-medium text-white/40 uppercase tracking-wider mb-1.5">{label}</label>}
      <textarea className={`input resize-none ${className}`} {...props} />
    </div>
  )
}

export function Modal({ open, onClose, title, children, wide }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <div className={`relative w-full ${wide ? 'max-w-2xl' : 'max-w-md'} bg-[#0c0c0c] border border-white/[0.08] rounded-2xl shadow-2xl animate-in max-h-[90vh] flex flex-col`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <h2 className="text-[15px] font-semibold text-white">{title}</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-white/30 hover:text-white hover:bg-white/[0.06] transition-all">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="px-6 py-5 overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}

export function EmptyState({ icon, title, description }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mb-4 text-white/20">
        {icon}
      </div>
      <p className="text-sm font-medium text-white/60 mb-1">{title}</p>
      {description && <p className="text-xs text-white/30">{description}</p>}
    </div>
  )
}

import { getStatusLabel } from '../utils/formatters'

export function StatusBadge({ status }) {
  const map = {
    PENDING: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    IN_PROGRESS: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    COMPLETED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    CANCELLED: 'bg-red-500/10 text-red-400 border-red-500/20',
  }
  return <span className={`badge border ${map[status] || map.PENDING}`}>{getStatusLabel(status)}</span>
}
