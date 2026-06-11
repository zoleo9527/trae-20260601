import { json } from '@sveltejs/kit';
import { prepare } from '$lib/server/db.js';

export async function GET({ url }) {
  const role = url.searchParams.get('role');

  let sql = 'SELECT * FROM users';
  const params = [];

  if (role) {
    sql += ' WHERE role = ?';
    params.push(role);
  }

  sql += ' ORDER BY id';

  const stmt = prepare(sql);
  const users = await stmt.all(...params);

  return json({ users });
}
