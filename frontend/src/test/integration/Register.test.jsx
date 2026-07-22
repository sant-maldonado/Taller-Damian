import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Register from '../../pages/Register'

const mockRegister = vi.fn()
const mockMe = vi.fn()

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ register: (...args) => mockRegister(...args) }),
}))

vi.mock('../../services/api-neon', () => ({
  auth: {
    register: (...args) => mockRegister(...args),
    me: (...args) => mockMe(...args),
  },
}))

function renderRegister() {
  return render(
    <MemoryRouter>
      <Register />
    </MemoryRouter>
  )
}

describe('Register', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRegister.mockResolvedValue({ id: 1, name: 'Juan', role: 'client' })
  })

  it('renders registration form', () => {
    renderRegister()
    expect(screen.getByText('Registrate')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Juan Pérez')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('30123456')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('ABC 123')).toBeInTheDocument()
  })

  it('has link to login', () => {
    renderRegister()
    expect(screen.getByText('¿Ya tenés cuenta? Iniciá sesión')).toBeInTheDocument()
  })

  it('submits registration with all fields', async () => {
    const user = userEvent.setup()
    renderRegister()

    await user.type(screen.getByPlaceholderText('Juan Pérez'), 'Juan Pérez')
    await user.type(screen.getByPlaceholderText('30123456'), '30123456')
    await user.type(screen.getByPlaceholderText('11-1234-5678'), '11-1234-5678')
    await user.type(screen.getByPlaceholderText('juan@email.com'), 'juan@test.com')
    await user.type(screen.getByPlaceholderText('Mínimo 6 caracteres'), 'test1234')
    await user.type(screen.getByPlaceholderText('ABC 123'), 'XYZ 789')
    await user.click(screen.getByText('Crear cuenta'))

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Juan Pérez',
        dni: '30123456',
        phone: '11-1234-5678',
        email: 'juan@test.com',
        password: 'test1234',
        plate: 'XYZ 789',
      }))
    })
  })

  it('shows error on duplicate email', async () => {
    mockRegister.mockRejectedValue(new Error('El email ya está registrado'))
    const user = userEvent.setup()
    renderRegister()

    await user.type(screen.getByPlaceholderText('Juan Pérez'), 'Juan')
    await user.type(screen.getByPlaceholderText('30123456'), '30123456')
    await user.type(screen.getByPlaceholderText('11-1234-5678'), '11-1111-1111')
    await user.type(screen.getByPlaceholderText('juan@email.com'), 'existing@test.com')
    await user.type(screen.getByPlaceholderText('Mínimo 6 caracteres'), 'test1234')
    await user.type(screen.getByPlaceholderText('ABC 123'), 'ABC 123')
    await user.click(screen.getByText('Crear cuenta'))

    await waitFor(() => {
      expect(screen.getByText('El email ya está registrado')).toBeInTheDocument()
    })
  })

  it('shows error on duplicate plate', async () => {
    mockRegister.mockRejectedValue(new Error('La patente ya está registrada'))
    const user = userEvent.setup()
    renderRegister()

    await user.type(screen.getByPlaceholderText('Juan Pérez'), 'Juan')
    await user.type(screen.getByPlaceholderText('30123456'), '30123456')
    await user.type(screen.getByPlaceholderText('11-1234-5678'), '11-1111-1111')
    await user.type(screen.getByPlaceholderText('juan@email.com'), 'juan@test.com')
    await user.type(screen.getByPlaceholderText('Mínimo 6 caracteres'), 'test1234')
    await user.type(screen.getByPlaceholderText('ABC 123'), 'ABC 123')
    await user.click(screen.getByText('Crear cuenta'))

    await waitFor(() => {
      expect(screen.getByText('La patente ya está registrada')).toBeInTheDocument()
    })
  })

  it('sends optional vehicle fields when provided', async () => {
    const user = userEvent.setup()
    renderRegister()

    await user.type(screen.getByPlaceholderText('Juan Pérez'), 'Juan')
    await user.type(screen.getByPlaceholderText('30123456'), '30123456')
    await user.type(screen.getByPlaceholderText('11-1234-5678'), '11-1111-1111')
    await user.type(screen.getByPlaceholderText('juan@email.com'), 'juan@test.com')
    await user.type(screen.getByPlaceholderText('Mínimo 6 caracteres'), 'test1234')
    await user.type(screen.getByPlaceholderText('ABC 123'), 'ABC 123')
    await user.type(screen.getByPlaceholderText('Toyota'), 'Toyota')
    await user.type(screen.getByPlaceholderText('Corolla'), 'Corolla')
    await user.type(screen.getByPlaceholderText('2020'), '2022')
    await user.click(screen.getByText('Crear cuenta'))

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith(expect.objectContaining({
        brand: 'Toyota',
        model: 'Corolla',
        year: '2022',
      }))
    })
  })
})
