import { createContext, useContext, useEffect, useState } from 'react'
import { signIn as apiSignIn, signUp as apiSignUp, signOut as apiSignOut, getCurrentUser } from '../services/api'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCurrentUser().then(u => {
      setUser(u)
      setLoading(false)
    })
  }, [])

  const signIn = async (email, password) => {
    const data = await apiSignIn(email, password)
    setUser(data.user)
    return data
  }

  const signUp = async (email, password, name) => {
    const data = await apiSignUp(email, password, name)
    setUser(data.user)
    return data
  }

  const signOut = async () => {
    await apiSignOut()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
