import type { PageServerLoad } from './$types';
import db, { seedDatabase } from '$lib/server/db';
import { redirect } from '@sveltejs/kit';

seedDatabase();

export const load: PageServerLoad = async ({ locals, cookies }) => {
  const userId = cookies.get('user_id');

  if (!userId) {
    throw redirect(302, '/login');
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;

  if (!user) {
    throw redirect(302, '/login');
  }

  const stats = db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM exhibits) as totalExhibits,
      (SELECT COUNT(*) FROM exhibits WHERE status = 'normal') as normalExhibits,
      (SELECT COUNT(*) FROM exhibits WHERE status IN ('fault_pending', 'repairing')) as faultExhibits,
      (SELECT COUNT(*) FROM inspections WHERE date(created_at) = date('now')) as todayInspections,
      (SELECT COUNT(*) FROM fault_reports WHERE status = 'pending') as pendingFaults,
      (SELECT COUNT(*) FROM fault_reports WHERE status = 'processing') as processingFaults,
      (SELECT COUNT(*) FROM fault_reports WHERE status = 'completed') as completedFaults
  `).get() as any;

  const recentLogs = db.prepare(`
    SELECT
      l.*,
      u.name as operator_name,
      u.role as operator_role
    FROM operation_logs l
    LEFT JOIN users u ON l.operator_id = u.id
    ORDER BY l.created_at DESC
    LIMIT 10
  `).all();

  let todos: any[] = [];
  let risks: any[] = [];

  if (user.role === 'exhibitor') {
    const pendingFaults = db.prepare(`
      SELECT
        f.*,
        e.name as exhibit_name,
        e.location as exhibit_location
      FROM fault_reports f
      LEFT JOIN exhibits e ON f.exhibit_id = e.id
      WHERE f.status = 'pending'
      ORDER BY f.created_at ASC
      LIMIT 5
    `).all();

    todos = pendingFaults.map((fault: any) => ({
      type: 'fault',
      id: fault.id,
      title: `故障报修：${fault.exhibit_name}`,
      description: fault.description,
      priority: 'high',
      created_at: fault.created_at
    }));
  }

  if (user.role === 'engineer') {
    const assignedFaults = db.prepare(`
      SELECT
        f.*,
        e.name as exhibit_name,
        e.location as exhibit_location
      FROM fault_reports f
      LEFT JOIN exhibits e ON f.exhibit_id = e.id
      WHERE (f.status = 'pending' OR (f.status = 'processing' AND f.assignee_id = ?))
      ORDER BY
        CASE WHEN f.status = 'pending' THEN 0 ELSE 1 END,
        f.created_at ASC
      LIMIT 5
    `).all(userId);

    todos = assignedFaults.map((fault: any) => ({
      type: 'fault',
      id: fault.id,
      title: fault.status === 'pending' ? `待接收：${fault.exhibit_name}` : `处理中：${fault.exhibit_name}`,
      description: fault.description,
      priority: fault.status === 'pending' ? 'high' : 'medium',
      created_at: fault.created_at
    }));
  }

  const riskFaults = db.prepare(`
    SELECT
      f.*,
      e.name as exhibit_name,
      e.location as exhibit_location,
      julianday('now') - julianday(f.created_at) as days_since_created
    FROM fault_reports f
    LEFT JOIN exhibits e ON f.exhibit_id = e.id
    WHERE f.status IN ('pending', 'processing')
    ORDER BY days_since_created DESC
    LIMIT 5
  `).all();

  risks = riskFaults.map((fault: any) => ({
    type: 'fault',
    id: fault.id,
    title: `${fault.exhibit_name} - ${fault.description}`,
    risk: fault.status === 'pending' ? '待接收' : '处理中',
    status: fault.status,
    duration: `${Math.floor(fault.days_since_created)}天`
  }));

  return {
    user,
    stats,
    todos,
    risks,
    recentLogs
  };
};
