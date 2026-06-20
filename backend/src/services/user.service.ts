import db from '../config/database';
import { User, UserRole } from '../types';
import { generateId } from '../utils/helpers';

export const createUser = (username: string, name: string, role: UserRole): User => {
  const id = generateId();
  const stmt = db.prepare(`
    INSERT INTO users (id, username, name, role)
    VALUES (?, ?, ?, ?)
  `);
  stmt.run(id, username, name, role);
  return getUserById(id)!;
};

export const getUserById = (id: string): User | undefined => {
  const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
  return stmt.get(id) as User | undefined;
};

export const getUserByUsername = (username: string): User | undefined => {
  const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
  return stmt.get(username) as User | undefined;
};

export const getAllUsers = (): User[] => {
  const stmt = db.prepare('SELECT * FROM users ORDER BY created_at DESC');
  return stmt.all() as User[];
};

export const getUsersByRole = (role: UserRole): User[] => {
  const stmt = db.prepare('SELECT * FROM users WHERE role = ? ORDER BY created_at DESC');
  return stmt.all(role) as User[];
};
