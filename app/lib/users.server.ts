import pool from 'api/db'
import type { User, UserRole } from 'shared/types'

export async function getUsers(role?: UserRole): Promise<User[]> {
  const params: unknown[] = []
  let sql = 'SELECT id, username, name, role FROM users WHERE 1=1'

  if (role) {
    params.push(role)
    sql += ` AND role = $${params.length}`
  }

  sql += ' ORDER BY id'

  const result = await pool.query(sql, params)
  return result.rows as User[]
}
