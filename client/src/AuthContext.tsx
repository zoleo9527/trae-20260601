import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { Role, Staff } from './types'

const STORAGE_KEY = 'hotel_auth'

interface AuthState {
  staff: Staff | null
  role: Role
}

interface AuthContextValue extends AuthState {
  login: (staff: Staff) => void
  logout: () => void
  switchRole: (role: Role) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function loadSaved(): AuthState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return { staff: null, role: 'supervisor' }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(loadSaved)

  const persist = (next: AuthState) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    setState(next)
  }

  const login = useCallback((staff: Staff) => {
    persist({ staff, role: staff.role })
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setState({ staff: null, role: 'supervisor' })
  }, [])

  const switchRole = useCallback((role: Role) => {
    setState(prev => {
      const next = { ...prev, role }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  return (
    <AuthContext.Provider value={{ ...state, login, logout, switchRole }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
