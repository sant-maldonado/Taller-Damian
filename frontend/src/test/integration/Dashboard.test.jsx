import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '../test-utils'

const mockVehiclesList = vi.fn().mockImplementation(({ search } = {}) => {
  const all = [
    { id: 1, plate: 'PO4521', brand: 'Volkswagen', model: 'Gol', client_name: 'Lucas' },
    { id: 2, plate: 'ABC123', brand: 'Toyota', model: 'Corolla', client_name: 'Maria' },
  ]
  const items = search ? all.filter(v => [v.plate, v.brand, v.model, v.client_name].some(f => f.toLowerCase().includes(search.toLowerCase()))) : all
  return Promise.resolve({ items, total: items.length })
})

vi.mock('../../services/api-neon', () => ({
  clients: { list: vi.fn().mockResolvedValue({ items: [], total: 0 }) },
  vehicles: { list: (...args) => mockVehiclesList(...args) },
  orders: { list: vi.fn().mockResolvedValue({ items: [], total: 0 }) },
  invoices: { list: vi.fn().mockResolvedValue({ items: [], total: 0 }) },
}))

import Dashboard from '../../pages/Dashboard'

describe('Dashboard search integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('searches vehicles as you type', async () => {
    render(<Dashboard />)

    fireEvent.change(screen.getByPlaceholderText(/Buscar por patente/), { target: { value: 'po' } })

    await waitFor(() => {
      expect(screen.getByText('PO4521')).toBeInTheDocument()
    })
    expect(screen.getByText(/Volkswagen Gol/)).toBeInTheDocument()
  })

  it('shows no results message when nothing matches', async () => {
    render(<Dashboard />)

    fireEvent.change(screen.getByPlaceholderText(/Buscar por patente/), { target: { value: 'zzz' } })

    await waitFor(() => {
      expect(screen.getByText(/Sin resultados para «zzz»/)).toBeInTheDocument()
    })
  })

  it('filters by client name too', async () => {
    render(<Dashboard />)

    fireEvent.change(screen.getByPlaceholderText(/Buscar por patente/), { target: { value: 'maria' } })

    await waitFor(() => {
      expect(screen.getByText('ABC123')).toBeInTheDocument()
    })
  })
})