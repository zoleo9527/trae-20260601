import { createContext, useContext, useState, useEffect } from 'react'
import { api } from '../api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user')
    return stored ? JSON.parse(stored) : null
  })
  const [loading, setLoading] = useState(false)

  const login = async (name, password) => {
    const data = await api.auth.login(name, password)
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))
    setUser(data.user)
    return data.user
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  const refreshUser = async () => {
    try {
      setLoading(true)
      const data = await api.auth.me()
      setUser(data.user)
      localStorage.setItem('user', JSON.stringify(data.user))
    } catch {
      logout()
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user && localStorage.getItem('token')) {
      refreshUser()
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
