import { db } from './init';
import type { User } from './types';

export function getUserById(id: number): User | undefined {
  return db.prepare(`
    SELECT * FROM users WHERE id = ?
  `).get(id) as User | undefined;
}

export function getUserByUsername(username: string): User | undefined {
  return db.prepare(`
    SELECT * FROM users WHERE username = ?
  `).get(username) as User | undefined;
}

export function validateUser(username: string, password: string): User | undefined {
  const user = getUserByUsername(username);
  if (user && user.password === password) {
    return user;
  }
  return undefined;
}

export function createUser(data: Omit<User, 'id' | 'created_at' | 'updated_at'>): number {
  const stmt = db.prepare(`
    INSERT INTO users (username, password, role)
    VALUES (?, ?, ?)
  `);
  const result = stmt.run(data.username, data.password, data.role || 'staff');
  return result.lastInsertRowid as number;
}

export function updateUser(id: number, data: Partial<User>): void {
  const fields: string[] = [];
  const values: unknown[] = [];

  if (data.username !== undefined) { fields.push('username = ?'); values.push(data.username); }
  if (data.password !== undefined) { fields.push('password = ?'); values.push(data.password); }
  if (data.role !== undefined) { fields.push('role = ?'); values.push(data.role); }
  
  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);

  if (fields.length > 0) {
    const stmt = db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(...values);
  }
}
