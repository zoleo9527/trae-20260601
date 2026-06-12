import bcrypt from 'bcryptjs'
import * as UserRepository from '../repositories/UserRepository.js'
import { CreateUserRequest, SafeUser, UpdateUserRequest, User, UserRole } from '../types/types.js'

export async function getAllUsers(): Promise<SafeUser[]> {
  const users = await UserRepository.findAll()
  return users.map(UserRepository.userToSafeUser)
}

export async function getUserById(id: string): Promise<SafeUser | null> {
  const user = await UserRepository.findById(id)
  if (!user) {
    return null
  }
  return UserRepository.userToSafeUser(user)
}

export async function createUser(data: CreateUserRequest): Promise<SafeUser> {
  const existingUser = await UserRepository.findByUsername(data.username)
  if (existingUser) {
    throw new Error('Username already exists')
  }

  const hashedPassword = await bcrypt.hash(data.password, 10)

  const user = await UserRepository.createUser({
    username: data.username,
    password: hashedPassword,
    name: data.name,
    role: data.role,
    email: data.email || null,
    phone: data.phone || null,
    status: data.status || 'active'
  })

  return UserRepository.userToSafeUser(user)
}

export async function updateUser(id: string, data: UpdateUserRequest): Promise<SafeUser | null> {
  const existingUser = await UserRepository.findById(id)
  if (!existingUser) {
    return null
  }

  if (data.username && data.username !== existingUser.username) {
    const userWithUsername = await UserRepository.findByUsername(data.username)
    if (userWithUsername) {
      throw new Error('Username already exists')
    }
  }

  const updateData: Partial<User> = {
    username: data.username,
    name: data.name,
    role: data.role,
    email: data.email || null,
    phone: data.phone || null,
    status: data.status
  }

  if (data.password) {
    updateData.password = await bcrypt.hash(data.password, 10)
  }

  const user = await UserRepository.update(id, updateData)
  return user ? UserRepository.userToSafeUser(user) : null
}

export async function deleteUser(id: string): Promise<boolean> {
  return UserRepository.remove(id)
}

export async function getUsersByRole(role: UserRole): Promise<SafeUser[]> {
  const users = await UserRepository.findByRole(role)
  return users.map(UserRepository.userToSafeUser)
}

export async function getActiveUsers(): Promise<SafeUser[]> {
  const users = await UserRepository.findActive()
  return users.map(UserRepository.userToSafeUser)
}

export async function getHandoverableUsers(role: 'accountant' | 'manager'): Promise<SafeUser[]> {
  const roles: UserRole[] = role === 'accountant' ? [UserRole.ACCOUNTANT] : [UserRole.MANAGER]
  const users = await UserRepository.findByRoles(roles)
  return users.map(UserRepository.userToSafeUser)
}

export async function getUserStats(): Promise<{ total: number; active: number }> {
  const total = await UserRepository.count()
  const active = await UserRepository.countByStatus('active')
  return { total, active }
}