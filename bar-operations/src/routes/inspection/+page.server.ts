import type { PageServerLoad } from './$types';
import db from '$lib/server/db';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ cookies, url }) => {
  const userId = cookies.get('user_id');

  if (!userId) {
    throw redirect(302, '/login');
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;

  if (user.role !== 'exhibitor' && user.role !== 'admin') {
    throw redirect(302, '/');
  }

  const exhibitId = url.searchParams.get('exhibit_id');

  let exhibits = db.prepare(`
    SELECT * FROM exhibits ORDER BY name ASC
  `).all();

  if (exhibitId) {
    exhibits = exhibits.filter((e: any) => e.id === exhibitId);
  }

  const recentInspections = db.prepare(`
    SELECT
      i.*,
      e.name as exhibit_name,
      u.name as inspector_name
    FROM inspections i
    LEFT JOIN exhibits e ON i.exhibit_id = e.id
    LEFT JOIN users u ON i.inspector_id = u.id
    WHERE i.inspector_id = ?
    ORDER BY i.created_at DESC
    LIMIT 10
  `).all(userId);

  return {
    user,
    exhibits,
    recentInspections,
    selectedExhibitId: exhibitId
  };
};
