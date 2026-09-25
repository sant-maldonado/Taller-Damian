import { useState, useEffect } from 'react'
import { onNeedRefresh, emitUpdateRequest } from '../lib/pwa'

export default function UpdatePrompt() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    return onNeedRefresh(() => {
      if (sessionStorage.getItem('pwa_update_dismissed')) return
      setShow(true)
    })
  }, [])

  if (!show) return null

  function dismiss() {
    sessionStorage.setItem('pwa_update_dismissed', '1')
    setShow(false)
  }

  function update() {
    sessionStorage.removeItem('pwa_update_dismissed')
    setShow(false)
    emitUpdateRequest()
  }

  return (
    <div className="fixed bottom-20 lg:bottom-4 left-4 right-4 lg:left-auto lg:right-4 lg:w-80 z-50">
      <div className="bg-[#0c0c0c] border border-white/[0.1] rounded-2xl p-4 shadow-2xl flex items-center gap-4">
        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shrink-0">
          <svg className="w-5 h-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] text-white font-medium">Nueva versión disponible</p>
          <p className="text-[11px] text-white/30">Actualizá para ver los últimos cambios</p>
        </div>
        <div className="flex gap-2">
          <button onClick={dismiss} className="text-[11px] text-white/30 hover:text-white/60 px-2 py-1">
            Ahora no
          </button>
          <button onClick={update} className="text-[11px] text-white bg-white/10 hover:bg-white/15 px-3 py-1.5 rounded-lg font-medium transition-colors">
            Actualizar
          </button>
        </div>
      </div>
    </div>
  )
}