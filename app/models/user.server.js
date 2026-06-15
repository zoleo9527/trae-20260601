import { query } from '~/utils/db.server';

export async function login(username, password) {
  const result = await query(
    'SELECT * FROM users WHERE username = $1 AND password = $2',
    [username, password]
  );
  return result.rows[0] || null;
}

export async function getUserById(id) {
  const result = await query('SELECT * FROM users WHERE id = $1', [id]);
  return result.rows[0] || null;
}

export async function getUserByUsername(username) {
  const result = await query('SELECT * FROM users WHERE username = $1', [username]);
  return result.rows[0] || null;
}
