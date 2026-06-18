import type { PageServerLoad } from './$types';
import db from '$lib/server/db';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ cookies, url }) => {
  const userId = cookies.get('user_id');

  if (!userId) {
    throw redirect(302, '/login');
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;

  const statusFilter = url.searchParams.get('status') || 'all';
  const exhibitIdFilter = url.searchParams.get('exhibit_id');

  let query = `
    SELECT
      f.*,
      e.name as exhibit_name,
      e.location as exhibit_location,
      r.name as reporter_name,
      a.name as assignee_name
    FROM fault_reports f
    LEFT JOIN exhibits e ON f.exhibit_id = e.id
    LEFT JOIN users r ON f.reporter_id = r.id
    LEFT JOIN users a ON f.assignee_id = a.id
  `;

  const conditions: string[] = [];
  const params: any[] = [];

  if (statusFilter !== 'all') {
    conditions.push('f.status = ?');
    params.push(statusFilter);
  }

  if (exhibitIdFilter) {
    conditions.push('f.exhibit_id = ?');
    params.push(exhibitIdFilter);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY f.created_at DESC';

  const faults = db.prepare(query).all(...params);

  return {
    user,
    faults,
    statusFilter,
    exhibitIdFilter
  };
};
