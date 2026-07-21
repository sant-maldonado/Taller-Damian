import { useState, useEffect } from 'react'

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState(null)
  const [show, setShow] = useState(false)

  useEffect(() => {
    function handler(e) {
      if (localStorage.getItem('install_shown')) return
      e.preventDefault()
      setDeferred(e)
      setShow(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  if (!show) return null

  async function install() {
    if (!deferred) return
    deferred.prompt()
    const { outcome } = await deferred.userChoice
    if (outcome === 'accepted') localStorage.setItem('install_shown', '1')
    setDeferred(null)
    setShow(false)
  }

  return (
    <div className="fixed bottom-20 lg:bottom-4 left-4 right-4 lg:left-auto lg:right-4 lg:w-80 z-50">
      <div className="bg-[#0c0c0c] border border-white/[0.1] rounded-2xl p-4 shadow-2xl flex items-center gap-4">
        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shrink-0">
          <svg className="w-5 h-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] text-white font-medium">Instalar Taller Mecánico</p>
          <p className="text-[11px] text-white/30">Accedé rápido desde tu pantalla de inicio</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShow(false)} className="text-[11px] text-white/30 hover:text-white/60 px-2 py-1">
            Ahora no
          </button>
          <button onClick={install} className="text-[11px] text-white bg-white/10 hover:bg-white/15 px-3 py-1.5 rounded-lg font-medium transition-colors">
            Instalar
          </button>
        </div>
      </div>
    </div>
  )
}
