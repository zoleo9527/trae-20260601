import type { PageServerLoad } from './$types';
import db from '$lib/server/db';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ cookies }) => {
  const userId = cookies.get('user_id');

  if (!userId) {
    throw redirect(302, '/login');
  }

  const exhibits = db.prepare(`
    SELECT
      e.*,
      (SELECT COUNT(*) FROM fault_reports WHERE exhibit_id = e.id AND status != 'completed') as fault_count
    FROM exhibits e
    ORDER BY
      CASE e.status
        WHEN 'fault_pending' THEN 0
        WHEN 'repairing' THEN 1
        WHEN 'inspecting' THEN 2
        ELSE 3
      END,
      e.name ASC
  `).all();

  return { exhibits };
};
