import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import db from '$lib/server/db';

export const POST: RequestHandler = async ({ params, request }) => {
  try {
    const data = await request.json();
    const { operator_id, repair_notes } = data;

    const fault = db.prepare('SELECT * FROM fault_reports WHERE id = ?').get(params.id) as any;

    if (!fault) {
      return json({ error: 'Fault report not found' }, { status: 404 });
    }

    if (fault.status === 'pending') {
      return json({ error: 'Fault report must be received before completing' }, { status: 400 });
    }

    if (fault.status === 'completed') {
      return json({ error: 'Fault report is already completed' }, { status: 400 });
    }

    if (fault.assignee_id !== operator_id) {
      return json({ error: 'Only assigned engineer can complete this fault' }, { status: 403 });
    }

    const transaction = db.transaction(() => {
      const updateFault = db.prepare(`
        UPDATE fault_reports
        SET status = 'completed', repair_notes = ?, completed_at = datetime('now')
        WHERE id = ?
      `);
      updateFault.run(repair_notes || fault.repair_notes, params.id);

      const updateExhibit = db.prepare('UPDATE exhibits SET status = ? WHERE id = ?');
      updateExhibit.run('normal', fault.exhibit_id);

      const insertLog = db.prepare(`
        INSERT INTO operation_logs (id, type, operator_id, target_id, target_type, details)
        VALUES (?, 'fault_completed', ?, ?, 'fault_report', ?)
      `);
      const logId = `log-${Date.now()}`;
      const logDetails = `故障已修复：${repair_notes || fault.repair_notes || '维修完成'}`;
      insertLog.run(logId, operator_id, params.id, logDetails);
    });

    transaction();

    const updatedFault = db.prepare(`
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
      WHERE f.id = ?
    `).get(params.id);

    return json(updatedFault);
  } catch (error) {
    console.error('Failed to complete fault:', error);
    return json({ error: 'Failed to complete fault' }, { status: 500 });
  }
};
