import type { PageServerLoad } from './$types';
import db from '$lib/server/db';
import { redirect, error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, cookies }) => {
  const userId = cookies.get('user_id');

  if (!userId) {
    throw redirect(302, '/login');
  }

  const exhibit = db.prepare('SELECT * FROM exhibits WHERE id = ?').get(params.id) as any;

  if (!exhibit) {
    throw error(404, '展项不存在');
  }

  const inspections = db.prepare(`
    SELECT
      i.*,
      u.name as inspector_name
    FROM inspections i
    LEFT JOIN users u ON i.inspector_id = u.id
    WHERE i.exhibit_id = ?
    ORDER BY i.created_at DESC
    LIMIT 10
  `).all(params.id);

  const faults = db.prepare(`
    SELECT
      f.*,
      r.name as reporter_name,
      a.name as assignee_name
    FROM fault_reports f
    LEFT JOIN users r ON f.reporter_id = r.id
    LEFT JOIN users a ON f.assignee_id = a.id
    WHERE f.exhibit_id = ?
    ORDER BY f.created_at DESC
  `).all(params.id);

  return {
    exhibit,
    inspections,
    faults
  };
};
