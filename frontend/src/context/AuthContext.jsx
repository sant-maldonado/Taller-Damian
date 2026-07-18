import { createContext, useContext, useState, useEffect } from 'react'
import { auth } from '../services/api-neon'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    const token = localStorage.getItem('token')
    if (!token) {
      setLoading(false)
      return
    }

    try {
      const { user: userData } = await auth.me()
      setUser(userData)
    } catch (error) {
      localStorage.removeItem('token')
    } finally {
      setLoading(false)
    }
  }

  async function login(email, password) {
    const { token, user: userData } = await auth.login(email, password)
    localStorage.setItem('token', token)
    setUser(userData)
    return userData
  }

  async function register(data) {
    const { token, user: userData } = await auth.register(data)
    localStorage.setItem('token', token)
    setUser(userData)
    return userData
  }

  function logout() {
    localStorage.removeItem('token')
    setUser(null)
  }

  function hasPermission(permission) {
    return user?.permissions?.includes(permission) || false
  }

  function hasRole(role) {
    return user?.role === role
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, hasPermission, hasRole, checkAuth }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider')
  }
  return context
}
