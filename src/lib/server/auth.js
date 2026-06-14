import db from '$lib/server/db.js';
import bcrypt from 'bcryptjs';

export function authenticateUser(username, password) {
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  
  if (!user) {
    return null;
  }

  if (!bcrypt.compareSync(password, user.password_hash)) {
    return null;
  }

  return {
    id: user.id,
    username: user.username,
    real_name: user.real_name,
    role: user.role,
    department: user.department,
    phone: user.phone,
    is_demo: user.is_demo === 1
  };
}

export function getUserById(id) {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!user) return null;

  return {
    id: user.id,
    username: user.username,
    real_name: user.real_name,
    role: user.role,
    department: user.department,
    phone: user.phone,
    is_demo: user.is_demo === 1
  };
}

export function getAllDemoUsers() {
  return db.prepare('SELECT id, username, real_name, role, department FROM users WHERE is_demo = 1').all();
}
