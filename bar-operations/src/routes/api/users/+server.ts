import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import db from '$lib/server/db';

export const GET: RequestHandler = async () => {
  try {
    const users = db.prepare('SELECT * FROM users ORDER BY role, name').all();
    return json(users);
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return json({ error: 'Failed to fetch users' }, { status: 500 });
  }
};

export const POST: RequestHandler = async ({ request }) => {
  try {
    const data = await request.json();
    const { user_id } = data;

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(user_id);

    if (!user) {
      return json({ error: 'User not found' }, { status: 404 });
    }

    return json(user);
  } catch (error) {
    console.error('Failed to get user:', error);
    return json({ error: 'Failed to get user' }, { status: 500 });
  }
};
