import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { users } from '../data/mockData'

const USER_STORAGE_KEY = 'current_user'

const AppContext = createContext()

export function AppProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    const stored = localStorage.getItem(USER_STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
    return users[0]
  })

  const login = useCallback((user) => {
    setCurrentUser(user)
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user))
  }, [])

  const hasPermission = useCallback((module, action) => {
    const permissions = {
      breeder: {
        pregnancyTest: ['view', 'review', 'create'],
        farrowingRoom: ['view', 'create', 'edit', 'assign'],
      },
      veterinarian: {
        pregnancyTest: ['view', 'create', 'edit'],
        farrowingRoom: ['view'],
      },
      manager: {
        pregnancyTest: ['view', 'approve', 'reject', 'review'],
        farrowingRoom: ['view', 'approve', 'reject', 'create', 'edit'],
      },
    }
    const userPermissions = permissions[currentUser?.role] || {}
    const modulePermissions = userPermissions[module] || []
    return modulePermissions.includes(action)
  }, [currentUser])

  return (
    <AppContext.Provider value={{ currentUser, login, hasPermission, users }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}