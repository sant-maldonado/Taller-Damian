import { render as rtlRender } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'

const defaultAuthValue = {
  user: { id: 1, name: 'Admin', email: 'admin@taller.com', role: 'admin' },
  loading: false,
  login: vi.fn(),
  logout: vi.fn(),
  checkAuth: vi.fn(),
}

vi.mock('../context/AuthContext', () => ({
  useAuth: () => defaultAuthValue,
  AuthProvider: ({ children }) => children,
}))

function AllProviders({ children }) {
  return <MemoryRouter>{children}</MemoryRouter>
}

function customRender(ui, options) {
  return rtlRender(ui, { wrapper: AllProviders, ...options })
}

export function mockAuth(overrides = {}) {
  Object.assign(defaultAuthValue, overrides)
  return defaultAuthValue
}

export * from '@testing-library/react'
export { customRender as render }
