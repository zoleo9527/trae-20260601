import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import db from '$lib/server/db';

export const POST: RequestHandler = async ({ params, request }) => {
  try {
    const data = await request.json();
    const { operator_id } = data;

    const fault = db.prepare('SELECT * FROM fault_reports WHERE id = ?').get(params.id) as any;

    if (!fault) {
      return json({ error: 'Fault report not found' }, { status: 404 });
    }

    if (fault.status !== 'pending') {
      return json({ error: 'Fault report has already been received' }, { status: 400 });
    }

    const transaction = db.transaction(() => {
      const updateFault = db.prepare(`
        UPDATE fault_reports
        SET assignee_id = ?, status = 'processing', received_at = datetime('now')
        WHERE id = ?
      `);
      updateFault.run(operator_id, params.id);

      const updateExhibit = db.prepare('UPDATE exhibits SET status = ? WHERE id = ?');
      updateExhibit.run('repairing', fault.exhibit_id);

      const operator = db.prepare('SELECT name FROM users WHERE id = ?').get(operator_id) as any;

      const insertLog = db.prepare(`
        INSERT INTO operation_logs (id, type, operator_id, target_id, target_type, details)
        VALUES (?, 'fault_received', ?, ?, 'fault_report', ?)
      `);
      const logId = `log-${Date.now()}`;
      const logDetails = `设备工程师${operator.name}接收故障工单`;
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
    console.error('Failed to receive fault:', error);
    return json({ error: 'Failed to receive fault' }, { status: 500 });
  }
};
