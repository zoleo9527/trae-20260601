import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import * as UserRepository from '../repositories/UserRepository.js'
import { User, SafeUser, UserRole, LoginRequest, LoginResponse, JwtPayload } from '../types/types.js'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

export async function login(data: LoginRequest): Promise<LoginResponse | null> {
  const user = await UserRepository.findByUsername(data.username)
  if (!user) {
    return null
  }

  if (user.status !== 'active') {
    return null
  }

  const isPasswordValid = await bcrypt.compare(data.password, user.password)
  if (!isPasswordValid) {
    return null
  }

  const token = generateToken(user)
  const safeUser = UserRepository.userToSafeUser(user)

  return {
    token,
    user: safeUser
  }
}

export async function register(data: {
  username: string
  password: string
  name: string
  role: UserRole
  email?: string
  phone?: string
}): Promise<SafeUser> {
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
    status: 'active'
  })

  return UserRepository.userToSafeUser(user)
}

export async function getCurrentUser(userId: string): Promise<SafeUser | null> {
  const user = await UserRepository.findById(userId)
  if (!user) {
    return null
  }
  return UserRepository.userToSafeUser(user)
}

export async function verifyToken(token: string): Promise<JwtPayload | null> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload
    return decoded
  } catch {
    return null
  }
}

export function generateToken(user: User): string {
  const payload: JwtPayload = {
    userId: user.id,
    username: user.username,
    role: user.role
  }
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

export async function changePassword(userId: string, oldPassword: string, newPassword: string): Promise<boolean> {
  const user = await UserRepository.findById(userId)
  if (!user) {
    return false
  }

  const isPasswordValid = await bcrypt.compare(oldPassword, user.password)
  if (!isPasswordValid) {
    return false
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10)
  await UserRepository.update(userId, { password: hashedPassword })
  return true
}