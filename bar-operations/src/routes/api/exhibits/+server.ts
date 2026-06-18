import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import db, { seedDatabase } from '$lib/server/db';

seedDatabase();

export const GET: RequestHandler = async () => {
  try {
    const exhibits = db.prepare(`
      SELECT * FROM exhibits ORDER BY created_at DESC
    `).all();

    return json(exhibits);
  } catch (error) {
    console.error('Failed to fetch exhibits:', error);
    return json({ error: 'Failed to fetch exhibits' }, { status: 500 });
  }
};

export const POST: RequestHandler = async ({ request }) => {
  try {
    const data = await request.json();
    const { id, name, location, status = 'normal' } = data;

    const stmt = db.prepare(`
      INSERT INTO exhibits (id, name, location, status)
      VALUES (?, ?, ?, ?)
    `);

    stmt.run(id, name, location, status);

    const exhibit = db.prepare('SELECT * FROM exhibits WHERE id = ?').get(id);

    return json(exhibit, { status: 201 });
  } catch (error) {
    console.error('Failed to create exhibit:', error);
    return json({ error: 'Failed to create exhibit' }, { status: 500 });
  }
};
