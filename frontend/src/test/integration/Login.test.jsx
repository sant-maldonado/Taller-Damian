import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, mockAuth } from '../test-utils'
import Login from '../../pages/Login'

vi.mock('../../services/api-neon', () => ({ auth: { login: vi.fn() } }))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

describe('Login', () => {
  let mockLogin

  beforeEach(() => {
    vi.clearAllMocks()
    mockLogin = mockAuth()
  })

  it('renders login form with inputs and button', () => {
    render(<Login />)
    expect(screen.getByText('Iniciar sesión')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('30123456')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument()
  })

  it('shows error message when login fails', async () => {
    mockLogin.login.mockRejectedValueOnce(new Error('Credenciales inválidas'))
    render(<Login />)

    fireEvent.change(screen.getByPlaceholderText('30123456'), { target: { value: 'admin@taller.com' } })
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'wrongpass' } })
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }))

    await waitFor(() => {
      expect(screen.getByText('Credenciales inválidas')).toBeInTheDocument()
    })
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('calls login with identifier and password on submit', async () => {
    mockLogin.login.mockResolvedValueOnce()
    render(<Login />)

    fireEvent.change(screen.getByPlaceholderText('30123456'), { target: { value: 'admin@taller.com' } })
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'admin123' } })
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }))

    await waitFor(() => {
      expect(mockLogin.login).toHaveBeenCalledWith('admin@taller.com', 'admin123')
    })
  })

  it('navigates to "/" after successful login', async () => {
    mockLogin.login.mockResolvedValueOnce()
    render(<Login />)

    fireEvent.change(screen.getByPlaceholderText('30123456'), { target: { value: 'admin@taller.com' } })
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'admin123' } })
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }))

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/')
    })
  })

  it('shows loading state while logging in', async () => {
    let resolveLogin
    mockLogin.login.mockImplementation(() => new Promise((r) => { resolveLogin = r }))
    render(<Login />)

    fireEvent.change(screen.getByPlaceholderText('30123456'), { target: { value: 'admin@taller.com' } })
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'admin123' } })
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /entrando/i })).toBeDisabled()
    })

    resolveLogin()
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /entrar/i })).not.toBeDisabled()
    })
  })

  it('validates required fields via HTML attributes', () => {
    render(<Login />)
    const identifierInput = screen.getByPlaceholderText('30123456')
    const passwordInput = screen.getByPlaceholderText('••••••••')

    expect(identifierInput).toBeRequired()
    expect(passwordInput).toBeRequired()
    expect(passwordInput).toHaveAttribute('minLength', '6')
  })
})
