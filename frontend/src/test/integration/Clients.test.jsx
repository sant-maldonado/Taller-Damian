import { render as rtlRender, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import Clients from '../../pages/Clients'

function renderWithRouter(ui) {
  return rtlRender(ui, { wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter> })
}

const mockList = vi.fn().mockResolvedValue({
  items: [
    { id: 1, name: 'Martín López', phone: '11-2345-6789', dni: '30123456', email: 'martin@test.com' },
    { id: 2, name: 'Lucía García', phone: '11-3456-7890', dni: '30234567', email: 'lucia@test.com' },
  ],
  total: 2,
})
const mockCreate = vi.fn().mockResolvedValue({ id: 3 })
const mockUpdate = vi.fn().mockResolvedValue({ id: 1 })
const mockRemove = vi.fn().mockResolvedValue({})

vi.mock('../../services/api-neon', () => ({
  clients: {
    list: (...args) => mockList(...args),
    create: (...args) => mockCreate(...args),
    update: (...args) => mockUpdate(...args),
    remove: (...args) => mockRemove(...args),
  },
}))

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, name: 'Admin', role: 'admin' },
    loading: false,
  }),
}))

describe('Clients', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockList.mockResolvedValue({
      items: [
        { id: 1, name: 'Martín López', phone: '11-2345-6789', dni: '30123456', email: 'martin@test.com' },
        { id: 2, name: 'Lucía García', phone: '11-3456-7890', dni: '30234567', email: 'lucia@test.com' },
      ],
      total: 2,
    })
    mockCreate.mockResolvedValue({ id: 3 })
    mockUpdate.mockResolvedValue({ id: 1 })
    mockRemove.mockResolvedValue({})
  })

  it('renders client list with names and DNIs', async () => {
    renderWithRouter(<Clients />)
    await waitFor(() => {
      expect(screen.getByText('Martín López')).toBeInTheDocument()
      expect(screen.getByText('Lucía García')).toBeInTheDocument()
    })
    expect(screen.getByText('30123456')).toBeInTheDocument()
    expect(screen.getByText('30234567')).toBeInTheDocument()
  })

  it('shows loading state initially', () => {
    mockList.mockReturnValue(new Promise(() => {}))
    renderWithRouter(<Clients />)
    expect(screen.getByText('Cargando...')).toBeInTheDocument()
  })

  it('opens create modal when clicking "+ Nuevo cliente"', async () => {
    renderWithRouter(<Clients />)
    await waitFor(() => {
      expect(screen.getByText('Martín López')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText('+ Nuevo cliente'))
    expect(screen.getByText('Nuevo cliente')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Juan Pérez')).toBeInTheDocument()
  })

  it('fills form and submits to create a new client', async () => {
    renderWithRouter(<Clients />)
    await waitFor(() => {
      expect(screen.getByText('Martín López')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('+ Nuevo cliente'))

    fireEvent.change(screen.getByPlaceholderText('Juan Pérez'), { target: { value: 'Carlos Ruiz' } })
    fireEvent.change(screen.getByPlaceholderText('11-1234-5678'), { target: { value: '11-9999-0000' } })
    fireEvent.change(screen.getByPlaceholderText('12345678'), { target: { value: '40000000' } })
    fireEvent.change(screen.getByPlaceholderText('juan@email.com'), { target: { value: 'carlos@test.com' } })

    fireEvent.click(screen.getByText('Crear cliente'))

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith({
        name: 'Carlos Ruiz',
        phone: '11-9999-0000',
        email: 'carlos@test.com',
        dni: '40000000',
        address: '',
        notes: '',
      })
    })
  })

  it('clicks edit button and fills form to update client', async () => {
    renderWithRouter(<Clients />)
    await waitFor(() => {
      expect(screen.getByText('Martín López')).toBeInTheDocument()
    })

    const editButtons = screen.getAllByText('Editar')
    fireEvent.click(editButtons[0])

    await waitFor(() => {
      expect(screen.getByText('Editar cliente')).toBeInTheDocument()
    })

    const nameInput = screen.getByPlaceholderText('Juan Pérez')
    expect(nameInput.value).toBe('Martín López')

    fireEvent.change(nameInput, { target: { value: 'Martín López-editado' } })
    fireEvent.click(screen.getByText('Guardar cambios'))

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith({
        id: 1,
        name: 'Martín López-editado',
        phone: '11-2345-6789',
        email: 'martin@test.com',
        dni: '30123456',
        address: '',
        notes: '',
      })
    })
  })

  it('clicks delete and confirms removal', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)

    renderWithRouter(<Clients />)
    await waitFor(() => {
      expect(screen.getByText('Martín López')).toBeInTheDocument()
    })

    const deleteButtons = screen.getAllByText('Eliminar')
    fireEvent.click(deleteButtons[0])

    expect(window.confirm).toHaveBeenCalledWith('¿Eliminar cliente Martín López?')
    await waitFor(() => {
      expect(mockRemove).toHaveBeenCalledWith(1)
    })

    window.confirm.mockRestore()
  })

  it('search input filters clients', async () => {
    renderWithRouter(<Clients />)
    await waitFor(() => {
      expect(screen.getByText('Martín López')).toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText('Buscar por nombre, teléfono o DNI...')
    fireEvent.change(searchInput, { target: { value: 'Lucía' } })

    await waitFor(() => {
      expect(mockList).toHaveBeenCalledWith({ search: 'Lucía' })
    }, { timeout: 1000 })
  })
})
