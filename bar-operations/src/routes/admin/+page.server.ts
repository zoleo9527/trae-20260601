import type { PageServerLoad } from './$types';
import db from '$lib/server/db';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ cookies }) => {
  const userId = cookies.get('user_id');

  if (!userId) {
    throw redirect(302, '/login');
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;

  if (user.role !== 'admin') {
    throw redirect(302, '/');
  }

  const stats = {
    users: db.prepare('SELECT COUNT(*) as count FROM users').get() as any,
    exhibits: db.prepare('SELECT COUNT(*) as count FROM exhibits').get() as any,
    inspections: db.prepare('SELECT COUNT(*) as count FROM inspections').get() as any,
    faultReports: db.prepare('SELECT COUNT(*) as count FROM fault_reports').get() as any,
    operationLogs: db.prepare('SELECT COUNT(*) as count FROM operation_logs').get() as any
  };

  return {
    user,
    stats
  };
};
