import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '../test-utils'

const mockOrdersList = vi.fn().mockResolvedValue({
  items: [
    { id: 1, plate: 'ABC123', brand: 'Toyota', model: 'Corolla', status: 'PENDING', created_at: '2026-03-15' },
    { id: 2, plate: 'DEF456', brand: 'Honda', model: 'Civic', status: 'IN_PROGRESS', created_at: '2026-03-16' },
    { id: 3, plate: 'GHI789', brand: 'Ford', model: 'Focus', status: 'COMPLETED', created_at: '2026-03-17' },
  ],
  total: 3,
})
const mockOrdersCreate = vi.fn().mockResolvedValue({ id: 4 })
const mockOrdersFast = vi.fn().mockResolvedValue({ order: { id: 9 }, vehicle: {}, created: true })
const mockOrdersUpdate = vi.fn().mockResolvedValue({})
const mockOrdersRemove = vi.fn().mockResolvedValue({})
const mockOrdersAddService = vi.fn().mockResolvedValue({})
const mockOrdersRemoveService = vi.fn().mockResolvedValue({})

const mockVehiclesList = vi.fn().mockImplementation(({ search } = {}) => {
  const all = [
    { id: 1, plate: 'ABC123', brand: 'Toyota', model: 'Corolla' },
    { id: 2, plate: 'DEF456', brand: 'Honda', model: 'Civic' },
  ]
  const items = search ? all.filter(v => v.plate.toLowerCase().includes(search.toLowerCase())) : all
  return Promise.resolve({ items, total: items.length })
})

const mockServicesList = vi.fn().mockResolvedValue({
  items: [{ id: 1, name: 'Cambio de aceite', price: 5000 }],
  total: 1,
})

const mockGroqChat = vi.fn().mockResolvedValue({ description: 'Test', services: [] })

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, name: 'Admin', role: 'admin' },
    loading: false,
  }),
}))

vi.mock('../../services/api-neon', () => ({
  orders: {
    list: (...args) => mockOrdersList(...args),
    create: (...args) => mockOrdersCreate(...args),
    fast: (...args) => mockOrdersFast(...args),
    update: (...args) => mockOrdersUpdate(...args),
    remove: (...args) => mockOrdersRemove(...args),
    addService: (...args) => mockOrdersAddService(...args),
    removeService: (...args) => mockOrdersRemoveService(...args),
  },
  vehicles: {
    list: (...args) => mockVehiclesList(...args),
    history: vi.fn().mockResolvedValue({ items: [] }),
  },
  services: { list: (...args) => mockServicesList(...args) },
  groq: { chat: (...args) => mockGroqChat(...args) },
}))

import Orders from '../../pages/Orders'

describe('Orders integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockOrdersList.mockResolvedValue({
      items: [
        { id: 1, plate: 'ABC123', brand: 'Toyota', model: 'Corolla', status: 'PENDING', created_at: '2026-03-15' },
        { id: 2, plate: 'DEF456', brand: 'Honda', model: 'Civic', status: 'IN_PROGRESS', created_at: '2026-03-16' },
        { id: 3, plate: 'GHI789', brand: 'Ford', model: 'Focus', status: 'COMPLETED', created_at: '2026-03-17' },
      ],
      total: 3,
    })
    mockVehiclesList.mockImplementation(({ search } = {}) => {
      const all = [
        { id: 1, plate: 'ABC123', brand: 'Toyota', model: 'Corolla' },
        { id: 2, plate: 'DEF456', brand: 'Honda', model: 'Civic' },
      ]
      const items = search ? all.filter(v => v.plate.toLowerCase().includes(search.toLowerCase())) : all
      return Promise.resolve({ items, total: items.length })
    })
    mockOrdersFast.mockResolvedValue({ order: { id: 9 }, vehicle: {}, created: true })
    mockServicesList.mockResolvedValue({
      items: [{ id: 1, name: 'Cambio de aceite', price: 5000 }],
      total: 1,
    })
    vi.spyOn(window, 'confirm').mockReturnValue(true)
  })

  it('renders order list with plates and status badges', async () => {
    render(<Orders />)
    await waitFor(() => {
      expect(screen.getByText('ABC123')).toBeInTheDocument()
    })
    expect(screen.getByText('DEF456')).toBeInTheDocument()
    expect(screen.getByText('GHI789')).toBeInTheDocument()
    expect(screen.getByText('Toyota Corolla')).toBeInTheDocument()
    expect(screen.getByText('Honda Civic')).toBeInTheDocument()
    expect(screen.getByText('Ford Focus')).toBeInTheDocument()
    expect(screen.getByText('Pendiente')).toBeInTheDocument()
    expect(screen.getAllByText('En progreso').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Completado')).toBeInTheDocument()
  })

  it('shows loading state initially', async () => {
    let resolveLoad
    mockOrdersList.mockReturnValue(new Promise((resolve) => { resolveLoad = resolve }))

    render(<Orders />)
    expect(screen.getByText('Cargando...')).toBeInTheDocument()

    resolveLoad({ items: [], total: 0 })
    await waitFor(() => {
      expect(screen.queryByText('Cargando...')).not.toBeInTheDocument()
    })
  })

  it('clicks status tab to filter and calls orders.list with status param', async () => {
    render(<Orders />)
    await waitFor(() => {
      expect(screen.getByText('ABC123')).toBeInTheDocument()
    })

    const pendientesBtn = screen.getByText('Pendientes')
    fireEvent.click(pendientesBtn)

    await waitFor(() => {
      expect(mockOrdersList).toHaveBeenCalledWith({ status: 'PENDING' })
    })
  })

  it('opens Nueva orden modal when clicking the button', async () => {
    render(<Orders />)
    await waitFor(() => {
      expect(screen.getByText('ABC123')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('+ Nueva orden'))

    await waitFor(() => {
      expect(screen.getByText('Nueva orden de trabajo')).toBeInTheDocument()
    })
    expect(screen.getByText('Patente *')).toBeInTheDocument()
    expect(screen.getByText('Crear orden')).toBeInTheDocument()
  })

  it('creates an order for an existing vehicle by picking it from plate search', async () => {
    render(<Orders />)
    await waitFor(() => {
      expect(screen.getByText('ABC123')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('+ Nueva orden'))
    await waitFor(() => {
      expect(screen.getByText('Nueva orden de trabajo')).toBeInTheDocument()
    })

    const plateInput = screen.getByPlaceholderText('ABC123')
    fireEvent.change(plateInput, { target: { value: 'ABC123' } })

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Corolla/ })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /Corolla/ }))
    await waitFor(() => {
      expect(screen.getByText(/Cambiar/)).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Crear orden'))

    await waitFor(() => {
      expect(mockOrdersCreate).toHaveBeenCalledWith(
        expect.objectContaining({ vehicle_id: 1 })
      )
    })
  })

  it('creates an order for a new plate via fast create with optional fields', async () => {
    render(<Orders />)
    await waitFor(() => {
      expect(screen.getByText('ABC123')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('+ Nueva orden'))
    await waitFor(() => {
      expect(screen.getByText('Nueva orden de trabajo')).toBeInTheDocument()
    })

    const plateInput = screen.getByPlaceholderText('ABC123')
    fireEvent.change(plateInput, { target: { value: 'ZZZ999' } })

    await waitFor(() => {
      expect(screen.getByText(/Vehículo nuevo/)).toBeInTheDocument()
    })

    const ownerInput = screen.getByPlaceholderText('Nombre')
    fireEvent.change(ownerInput, { target: { value: 'Pepe' } })

    fireEvent.click(screen.getByText('Crear orden'))

    await waitFor(() => {
      expect(mockOrdersFast).toHaveBeenCalledWith(
        expect.objectContaining({ plate: 'ZZZ999', client_name: 'Pepe' })
      )
    })
  })

  it('clicks P/E/C status buttons and calls orders.update with correct status', async () => {
    render(<Orders />)
    await waitFor(() => {
      expect(screen.getByText('ABC123')).toBeInTheDocument()
    })

    const statusButtons = screen.getAllByText('E')
    fireEvent.click(statusButtons[0])

    await waitFor(() => {
      expect(mockOrdersUpdate).toHaveBeenCalledWith(expect.objectContaining({ status: 'IN_PROGRESS' }))
    })
  })

  it('clicks delete and confirms, calls orders.remove', async () => {
    render(<Orders />)
    await waitFor(() => {
      expect(screen.getByText('ABC123')).toBeInTheDocument()
    })

    const deleteButtons = screen.getAllByText('\u00d7')
    fireEvent.click(deleteButtons[0])

    expect(window.confirm).toHaveBeenCalledWith('¿Eliminar orden?')
    await waitFor(() => {
      expect(mockOrdersRemove).toHaveBeenCalledWith(1)
    })
  })

  it('shows empty state when no orders', async () => {
    mockOrdersList.mockResolvedValue({ items: [], total: 0 })

    render(<Orders />)
    await waitFor(() => {
      expect(screen.getByText('No hay órdenes')).toBeInTheDocument()
    })
  })
})
