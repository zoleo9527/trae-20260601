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

    if (fault.status !== 'processing') {
      return json({ error: 'Fault report must be received before processing' }, { status: 400 });
    }

    if (fault.assignee_id !== operator_id) {
      return json({ error: 'Only assigned engineer can process this fault' }, { status: 403 });
    }

    const transaction = db.transaction(() => {
      const updateFault = db.prepare(`
        UPDATE fault_reports
        SET repair_notes = ?
        WHERE id = ?
      `);
      updateFault.run(repair_notes, params.id);

      const insertLog = db.prepare(`
        INSERT INTO operation_logs (id, type, operator_id, target_id, target_type, details)
        VALUES (?, 'fault_processed', ?, ?, 'fault_report', ?)
      `);
      const logId = `log-${Date.now()}`;
      const logDetails = `正在维修：${repair_notes}`;
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
    console.error('Failed to process fault:', error);
    return json({ error: 'Failed to process fault' }, { status: 500 });
  }
};
