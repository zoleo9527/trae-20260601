import { useState, useCallback } from 'react'
import { User, UserRole } from '@/types'
import { users } from '@/data/mockData'

const initialUser: User = users[1]

export function useCurrentUser() {
  const [user, setUser] = useState<User>(initialUser)

  const switchRole = useCallback((role: UserRole) => {
    const userByRole = users.find(u => u.role === role) || initialUser
    setUser(userByRole)
  }, [])

  return { user, switchRole }
}