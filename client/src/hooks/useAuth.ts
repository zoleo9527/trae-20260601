import { useState, useCallback, useEffect } from 'react'
import type { User } from '../types'
import { authAPI } from '../api'

export function useAuth() {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('user')
    return saved ? JSON.parse(saved) : null
  })

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('token')
  })

  const isAuthenticated = !!token && !!user

  const role = user?.role ?? ''

  const isAdmin = role === 'admin' || role === 'manager'

  const login = useCallback(async (username: string, password: string) => {
    const res = await authAPI.login(username, password)
    const { token: newToken, user: newUser } = res.data
    localStorage.setItem('token', newToken)
    localStorage.setItem('user', JSON.stringify(newUser))
    setToken(newToken)
    setUser(newUser)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
  }, [])

  const refreshUser = useCallback(async () => {
    try {
      const res = await authAPI.getMe()
      const newUser = res.data
      localStorage.setItem('user', JSON.stringify(newUser))
      setUser(newUser)
    } catch {
      logout()
    }
  }, [logout])

  useEffect(() => {
    if (token && !user) {
      refreshUser()
    }
  }, [token, user, refreshUser])

  return { user, token, isAuthenticated, role, isAdmin, login, logout, refreshUser }
}
