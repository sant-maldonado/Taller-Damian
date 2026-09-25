import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '../test-utils'
import UpdatePrompt from '../../components/UpdatePrompt'

function fireNeedRefresh() {
  act(() => {
    window.dispatchEvent(new CustomEvent('pwa:need-refresh'))
  })
}

describe('UpdatePrompt', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('no muestra banner inicialmente', () => {
    render(<UpdatePrompt />)
    expect(screen.queryByText('Nueva versión disponible')).not.toBeInTheDocument()
  })

  it('muestra banner cuando hay una nueva versión', () => {
    render(<UpdatePrompt />)
    fireNeedRefresh()
    expect(screen.getByText('Nueva versión disponible')).toBeInTheDocument()
  })

  it('oculta banner y pide actualizar al tocar "Actualizar"', () => {
    const spy = vi.spyOn(window, 'dispatchEvent')
    render(<UpdatePrompt />)
    fireNeedRefresh()
    fireEvent.click(screen.getByRole('button', { name: /actualizar/i }))
    expect(screen.queryByText('Nueva versión disponible')).not.toBeInTheDocument()
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ type: 'pwa:update-request' }))
  })

  it('oculta banner y no pide actualizar al tocar "Ahora no"', () => {
    const spy = vi.spyOn(window, 'dispatchEvent')
    render(<UpdatePrompt />)
    fireNeedRefresh()
    fireEvent.click(screen.getByRole('button', { name: /ahora no/i }))
    expect(screen.queryByText('Nueva versión disponible')).not.toBeInTheDocument()
    expect(spy).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'pwa:update-request' }))
  })

  it('no vuelve a mostrar el banner en la misma sesión tras rechazarlo', () => {
    render(<UpdatePrompt />)
    fireNeedRefresh()
    fireEvent.click(screen.getByRole('button', { name: /ahora no/i }))
    fireNeedRefresh()
    expect(screen.queryByText('Nueva versión disponible')).not.toBeInTheDocument()
  })
})