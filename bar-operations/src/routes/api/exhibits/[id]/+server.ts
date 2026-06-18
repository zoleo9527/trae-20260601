import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import db from '$lib/server/db';

export const GET: RequestHandler = async ({ params }) => {
  try {
    const exhibit = db.prepare('SELECT * FROM exhibits WHERE id = ?').get(params.id);

    if (!exhibit) {
      return json({ error: 'Exhibit not found' }, { status: 404 });
    }

    return json(exhibit);
  } catch (error) {
    console.error('Failed to fetch exhibit:', error);
    return json({ error: 'Failed to fetch exhibit' }, { status: 500 });
  }
};

export const PATCH: RequestHandler = async ({ params, request }) => {
  try {
    const data = await request.json();
    const { status } = data;

    const stmt = db.prepare('UPDATE exhibits SET status = ? WHERE id = ?');
    stmt.run(status, params.id);

    const exhibit = db.prepare('SELECT * FROM exhibits WHERE id = ?').get(params.id);

    return json(exhibit);
  } catch (error) {
    console.error('Failed to update exhibit:', error);
    return json({ error: 'Failed to update exhibit' }, { status: 500 });
  }
};
