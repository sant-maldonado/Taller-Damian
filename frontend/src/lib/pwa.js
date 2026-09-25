const PWA_NEED_REFRESH = 'pwa:need-refresh'
const PWA_UPDATE_REQUEST = 'pwa:update-request'

export function onNeedRefresh(cb) {
  window.addEventListener(PWA_NEED_REFRESH, cb)
  return () => window.removeEventListener(PWA_NEED_REFRESH, cb)
}

export function emitNeedRefresh() {
  window.dispatchEvent(new CustomEvent(PWA_NEED_REFRESH))
}

export function onUpdateRequest(cb) {
  window.addEventListener(PWA_UPDATE_REQUEST, cb)
  return () => window.removeEventListener(PWA_UPDATE_REQUEST, cb)
}

export function emitUpdateRequest() {
  window.dispatchEvent(new CustomEvent(PWA_UPDATE_REQUEST))
}