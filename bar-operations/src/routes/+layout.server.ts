import type { LayoutServerLoad } from './$types';
import db, { seedDatabase } from '$lib/server/db';

seedDatabase();

export const load: LayoutServerLoad = async ({ cookies }) => {
  const userId = cookies.get('user_id');

  if (!userId) {
    return {
      user: null,
      users: []
    };
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  const users = db.prepare('SELECT * FROM users ORDER BY role, name').all();

  return {
    user: user || null,
    users
  };
};
