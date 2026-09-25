import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

const mockOrderDetail = vi.fn().mockResolvedValue({
  id: 'abc',
  plate: 'ABC123',
  brand: 'Toyota',
  model: 'Corolla',
  year: 2020,
  client_name: 'Juan Pérez',
  client_phone: '1141234567',
  status: 'COMPLETED',
  description: 'Cambio de aceite y filtros',
  notes: 'Revisar frenos en el próximo service',
  mileage: 45000,
  created_at: '2026-03-15T12:00:00',
  services: [
    { id: 1, name: 'Cambio de aceite', price: 5000 },
    { id: 2, name: 'Filtro de aire', price: 3000 },
  ],
  invoices: [{ id: 1, invoice_number: 7, total: 8000 }],
})

vi.mock('../../services/api-neon', () => ({
  orders: {
    detail: (...args) => mockOrderDetail(...args),
  },
  vehicles: { history: vi.fn().mockResolvedValue({ items: [] }) },
  services: { list: vi.fn().mockResolvedValue({ items: [] }) },
  clients: { list: vi.fn().mockResolvedValue({ items: [] }) },
  invoices: { list: vi.fn().mockResolvedValue({ items: [] }) },
  users: {},
  roles: {},
  groq: { chat: vi.fn() },
}))

import PrintOrder from '../../pages/PrintOrder'

describe('PrintOrder integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the receipt with vehicle, services and total', async () => {
    render(
      <MemoryRouter initialEntries={['/imprimir/abc']}>
        <Routes>
          <Route path="/imprimir/:orderId" element={<PrintOrder />} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('TALLER DAMIAN')).toBeInTheDocument()
    })

    expect(screen.getByText(/Toyota Corolla/)).toBeInTheDocument()
    expect(screen.getByText('Cambio de aceite')).toBeInTheDocument()
    expect(screen.getByText('Filtro de aire')).toBeInTheDocument()
    expect(screen.getAllByText(/8\.000/).length).toBeGreaterThan(0)
    expect(screen.getByText('N° 7')).toBeInTheDocument()
    expect(screen.getByText(/Juan Pérez/)).toBeInTheDocument()
  })

  it('shows error state when detail fails', async () => {
    mockOrderDetail.mockRejectedValueOnce(new Error('No se pudo cargar el trabajo'))

    render(
      <MemoryRouter initialEntries={['/imprimir/abc']}>
        <Routes>
          <Route path="/imprimir/:orderId" element={<PrintOrder />} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('No se pudo cargar el trabajo')).toBeInTheDocument()
    })
  })
})