import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import db from '$lib/server/db';

export const GET: RequestHandler = async () => {
  try {
    const logs = db.prepare(`
      SELECT
        l.*,
        u.name as operator_name,
        u.role as operator_role
      FROM operation_logs l
      LEFT JOIN users u ON l.operator_id = u.id
      ORDER BY l.created_at DESC
      LIMIT 20
    `).all();

    return json(logs);
  } catch (error) {
    console.error('Failed to fetch recent logs:', error);
    return json({ error: 'Failed to fetch recent logs' }, { status: 500 });
  }
};
