import { useState, useCallback } from 'react'
import { users } from '../data/mockData'

const STORAGE_KEY = 'current_user'

export function useAuth() {
  const [currentUser, setCurrentUser] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
    return users[0]
  })

  const login = useCallback((user) => {
    setCurrentUser(user)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
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

  return {
    currentUser,
    login,
    hasPermission,
    users,
  }
}