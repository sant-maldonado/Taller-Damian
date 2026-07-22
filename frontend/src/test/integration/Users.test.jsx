import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Users from '../../pages/Users'

const mockList = vi.fn().mockResolvedValue([
  { id: 1, name: 'Admin', email: 'admin@taller.com', phone: '11-1111-1111', role_name: 'admin', is_active: true },
  { id: 2, name: 'Mecánico Juan', email: 'juan@taller.com', phone: '11-2222-2222', role_name: 'mechanic', is_active: true },
])
const mockCreate = vi.fn().mockResolvedValue({ id: 3 })
const mockUpdate = vi.fn().mockResolvedValue({ id: 1 })
const mockRemove = vi.fn().mockResolvedValue({})

const mockRolesList = vi.fn().mockResolvedValue([
  { id: 1, name: 'admin', description: 'Administrador' },
  { id: 3, name: 'mechanic', description: 'Mecánico' },
])

vi.mock('../../services/api-neon', () => ({
  users: {
    list: (...args) => mockList(...args),
    create: (...args) => mockCreate(...args),
    update: (...args) => mockUpdate(...args),
    remove: (...args) => mockRemove(...args),
  },
  roles: {
    list: (...args) => mockRolesList(...args),
  },
}))

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, name: 'Admin', role: 'admin' },
    loading: false,
  }),
}))

function renderUsers() {
  return render(
    <MemoryRouter>
      <Users />
    </MemoryRouter>
  )
}

describe('Users', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockList.mockResolvedValue([
      { id: 1, name: 'Admin', email: 'admin@taller.com', phone: '11-1111-1111', role_name: 'admin', is_active: true },
      { id: 2, name: 'Mecánico Juan', email: 'juan@taller.com', phone: '11-2222-2222', role_name: 'mechanic', is_active: true },
    ])
    mockRolesList.mockResolvedValue([
      { id: 1, name: 'admin', description: 'Administrador' },
      { id: 3, name: 'mechanic', description: 'Mecánico' },
    ])
  })

  it('renders users list', async () => {
    renderUsers()
    expect(screen.getByText('Usuarios')).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByText('Admin')).toBeInTheDocument()
      expect(screen.getByText('Mecánico Juan')).toBeInTheDocument()
    })
  })

  it('shows user count', async () => {
    renderUsers()
    await waitFor(() => {
      expect(screen.getByText('2 usuarios en el sistema')).toBeInTheDocument()
    })
  })

  it('opens create modal', async () => {
    const user = userEvent.setup()
    renderUsers()
    await waitFor(() => expect(screen.getByText('Admin')).toBeInTheDocument())

    await user.click(screen.getByText('+ Nuevo usuario'))
    expect(screen.getByText('Nuevo usuario')).toBeInTheDocument()
  })

  it('creates a new user', async () => {
    const user = userEvent.setup()
    mockCreate.mockResolvedValue({ id: 3, name: 'Nuevo Mecánico' })
    renderUsers()
    await waitFor(() => expect(screen.getByText('Admin')).toBeInTheDocument())

    await user.click(screen.getByText('+ Nuevo usuario'))
    await user.type(screen.getByPlaceholderText('Juan Pérez'), 'Nuevo Mecánico')
    await user.type(screen.getByPlaceholderText('juan@email.com'), 'nuevo@taller.com')
    await user.type(screen.getByPlaceholderText('Mínimo 6 caracteres'), 'test1234')
    await user.click(screen.getByText('Crear usuario'))

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalled()
    })
  })

  it('opens edit modal', async () => {
    const user = userEvent.setup()
    renderUsers()
    await waitFor(() => expect(screen.getByText('Admin')).toBeInTheDocument())

    const editButtons = screen.getAllByText('Editar')
    await user.click(editButtons[0])
    expect(screen.getByText('Editar usuario')).toBeInTheDocument()
  })

  it('deactivates a user', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const user = userEvent.setup()
    renderUsers()
    await waitFor(() => expect(screen.getByText('Mecánico Juan')).toBeInTheDocument())

    const deactivateButtons = screen.getAllByText('Desactivar')
    await user.click(deactivateButtons[0])
    await waitFor(() => {
      expect(mockRemove).toHaveBeenCalled()
    })
  })

  it('shows inactive badge', async () => {
    mockList.mockResolvedValue([
      { id: 1, name: 'Admin', email: 'admin@taller.com', role_name: 'admin', is_active: true },
      { id: 2, name: 'Inactive User', email: 'inactive@taller.com', role_name: 'mechanic', is_active: false },
    ])
    renderUsers()
    await waitFor(() => {
      expect(screen.getByText('Inactivo')).toBeInTheDocument()
    })
  })

  it('filters users by search', async () => {
    const user = userEvent.setup()
    renderUsers()
    await waitFor(() => expect(screen.getByText('Mecánico Juan')).toBeInTheDocument())

    await user.type(screen.getByPlaceholderText(/buscar/i), 'juan')
    expect(screen.getByText('Mecánico Juan')).toBeInTheDocument()
    expect(screen.queryByText('Admin')).not.toBeInTheDocument()
  })
})
