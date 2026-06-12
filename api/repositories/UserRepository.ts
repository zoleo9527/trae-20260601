import { run, get, all } from '../database/database.js'
import { User, UserRole, SafeUser } from '../types/types.js'

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

function rowToUser(row: Record<string, unknown>): User {
  return {
    id: row.id as string,
    username: row.username as string,
    password: row.password as string,
    name: row.name as string,
    role: row.role as UserRole,
    email: row.email as string | null,
    phone: row.phone as string | null,
    status: row.status as 'active' | 'inactive',
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  }
}

function userToSafeUser(user: User): SafeUser {
  const { password: _, ...safeUser } = user
  return safeUser
}

export async function createUser(
  data: Omit<User, 'id' | 'createdAt' | 'updatedAt'>
): Promise<User> {
  const id = generateId()
  const now = new Date().toISOString()

  await run(
    `INSERT INTO users (id, username, password, name, role, email, phone, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, data.username, data.password, data.name, data.role, data.email, data.phone, data.status, now, now]
  )

  return findById(id) as Promise<User>
}

export async function findById(id: string): Promise<User | null> {
  const row = await get<Record<string, unknown>>('SELECT * FROM users WHERE id = ?', [id])
  return row ? rowToUser(row) : null
}

export async function findByUsername(username: string): Promise<User | null> {
  const row = await get<Record<string, unknown>>('SELECT * FROM users WHERE username = ?', [username])
  return row ? rowToUser(row) : null
}

export async function findAll(): Promise<User[]> {
  const rows = await all<Record<string, unknown>>('SELECT * FROM users ORDER BY created_at DESC')
  return rows.map(rowToUser)
}

export async function findByRole(role: UserRole): Promise<User[]> {
  const rows = await all<Record<string, unknown>>('SELECT * FROM users WHERE role = ? ORDER BY created_at DESC', [role])
  return rows.map(rowToUser)
}

export async function findActive(): Promise<User[]> {
  const rows = await all<Record<string, unknown>>("SELECT * FROM users WHERE status = 'active' ORDER BY created_at DESC")
  return rows.map(rowToUser)
}

export async function update(id: string, data: Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>>): Promise<User | null> {
  const fields: string[] = []
  const values: unknown[] = []

  if (data.username !== undefined) {
    fields.push('username = ?')
    values.push(data.username)
  }
  if (data.password !== undefined) {
    fields.push('password = ?')
    values.push(data.password)
  }
  if (data.name !== undefined) {
    fields.push('name = ?')
    values.push(data.name)
  }
  if (data.role !== undefined) {
    fields.push('role = ?')
    values.push(data.role)
  }
  if (data.email !== undefined) {
    fields.push('email = ?')
    values.push(data.email)
  }
  if (data.phone !== undefined) {
    fields.push('phone = ?')
    values.push(data.phone)
  }
  if (data.status !== undefined) {
    fields.push('status = ?')
    values.push(data.status)
  }

  if (fields.length === 0) {
    return findById(id)
  }

  fields.push('updated_at = ?')
  values.push(new Date().toISOString())
  values.push(id)

  await run(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values)
  return findById(id)
}

export async function remove(id: string): Promise<boolean> {
  const result = await run('DELETE FROM users WHERE id = ?', [id])
  return result.changes > 0
}

export async function count(): Promise<number> {
  const row = await get<{ count: number }>('SELECT COUNT(*) as count FROM users')
  return row?.count || 0
}

export async function countByStatus(status: string): Promise<number> {
  const row = await get<{ count: number }>('SELECT COUNT(*) as count FROM users WHERE status = ?', [status])
  return row?.count || 0
}

export { userToSafeUser }