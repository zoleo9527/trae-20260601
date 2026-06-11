import { getDb } from '../db/database.js';
import type { User, UserRole } from '../../shared/types.js';

export function getAllUsers(): User[] {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM users').all() as Array<{
    id: string;
    name: string;
    role: UserRole;
    phone: string;
    department: string;
  }>;

  return rows.map(row => ({
    id: row.id,
    name: row.name,
    role: row.role,
    phone: row.phone,
    department: row.department
  }));
}

export function getUserById(id: string): User | undefined {
  const db = getDb();
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as {
    id: string;
    name: string;
    role: UserRole;
    phone: string;
    department: string;
  } | undefined;

  if (!row) return undefined;

  return {
    id: row.id,
    name: row.name,
    role: row.role,
    phone: row.phone,
    department: row.department
  };
}

export function getUsersByRole(role: UserRole): User[] {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM users WHERE role = ?').all(role) as Array<{
    id: string;
    name: string;
    role: UserRole;
    phone: string;
    department: string;
  }>;

  return rows.map(row => ({
    id: row.id,
    name: row.name,
    role: row.role,
    phone: row.phone,
    department: row.department
  }));
}
