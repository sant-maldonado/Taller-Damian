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
const mockOrdersUpdate = vi.fn().mockResolvedValue({})
const mockOrdersRemove = vi.fn().mockResolvedValue({})
const mockOrdersAddService = vi.fn().mockResolvedValue({})
const mockOrdersRemoveService = vi.fn().mockResolvedValue({})

const mockVehiclesList = vi.fn().mockResolvedValue({
  items: [
    { id: 1, plate: 'ABC123', brand: 'Toyota', model: 'Corolla' },
    { id: 2, plate: 'DEF456', brand: 'Honda', model: 'Civic' },
  ],
  total: 2,
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
    mockVehiclesList.mockResolvedValue({
      items: [
        { id: 1, plate: 'ABC123', brand: 'Toyota', model: 'Corolla' },
        { id: 2, plate: 'DEF456', brand: 'Honda', model: 'Civic' },
      ],
      total: 2,
    })
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
    expect(screen.getByText('Seleccionar vehículo')).toBeInTheDocument()
    expect(screen.getByText('Crear orden')).toBeInTheDocument()
  })

  it('selects vehicle and submits to create order', async () => {
    render(<Orders />)
    await waitFor(() => {
      expect(screen.getByText('ABC123')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('+ Nueva orden'))
    await waitFor(() => {
      expect(screen.getByText('Nueva orden de trabajo')).toBeInTheDocument()
    })

    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: '1' } })

    fireEvent.click(screen.getByText('Crear orden'))

    await waitFor(() => {
      expect(mockOrdersCreate).toHaveBeenCalledWith(
        expect.objectContaining({ vehicle_id: '1' })
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
