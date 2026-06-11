import pool from 'api/db'
import bcrypt from 'bcryptjs'
import type { User } from 'shared/types'

interface UserWithPassword extends User {
  password_hash: string
}

export async function findUserByUsername(username: string): Promise<UserWithPassword | null> {
  const result = await pool.query('SELECT * FROM users WHERE username = $1', [username])
  if (result.rows.length === 0) return null
  return result.rows[0] as UserWithPassword
}

export async function verifyPassword(user: UserWithPassword, password: string): Promise<boolean> {
  return bcrypt.compare(password, user.password_hash)
}

export async function authenticateUser(username: string, password: string): Promise<User | null> {
  const user = await findUserByUsername(username)
  if (!user) return null
  const valid = await verifyPassword(user, password)
  if (!valid) return null
  const { password_hash: _ph, ...safeUser } = user
  return safeUser as User
}
