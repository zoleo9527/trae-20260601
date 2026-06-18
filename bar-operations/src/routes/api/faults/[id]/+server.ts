import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import db from '$lib/server/db';

export const GET: RequestHandler = async ({ params }) => {
  try {
    const fault = db.prepare(`
      SELECT
        f.*,
        e.name as exhibit_name,
        e.location as exhibit_location,
        e.status as exhibit_status,
        r.name as reporter_name,
        r.role as reporter_role,
        a.name as assignee_name,
        a.role as assignee_role,
        i.id as source_inspection_id,
        i.result as source_inspection_result,
        i.notes as source_inspection_notes,
        i.created_at as source_inspection_time
      FROM fault_reports f
      LEFT JOIN exhibits e ON f.exhibit_id = e.id
      LEFT JOIN users r ON f.reporter_id = r.id
      LEFT JOIN users a ON f.assignee_id = a.id
      LEFT JOIN inspections i ON f.inspection_id = i.id
      WHERE f.id = ?
    `).get(params.id) as any;

    if (!fault) {
      return json({ error: 'Fault report not found' }, { status: 404 });
    }

    const logs = db.prepare(`
      SELECT
        l.*,
        u.name as operator_name,
        u.role as operator_role
      FROM operation_logs l
      LEFT JOIN users u ON l.operator_id = u.id
      WHERE l.target_id = ? AND l.target_type = 'fault_report'
      ORDER BY l.created_at ASC
    `).all(params.id);

    fault.logs = logs;

    return json(fault);
  } catch (error) {
    console.error('Failed to fetch fault:', error);
    return json({ error: 'Failed to fetch fault' }, { status: 500 });
  }
};
