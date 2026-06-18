import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import db from '$lib/server/db';

export const GET: RequestHandler = async ({ url }) => {
  try {
    const status = url.searchParams.get('status');

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

    const params: any[] = [];

    if (status) {
      query += ' WHERE f.status = ?';
      params.push(status);
    }

    query += ' ORDER BY f.created_at DESC';

    const faults = db.prepare(query).all(...params);

    return json(faults);
  } catch (error) {
    console.error('Failed to fetch faults:', error);
    return json({ error: 'Failed to fetch faults' }, { status: 500 });
  }
};

export const POST: RequestHandler = async ({ request }) => {
  try {
    const data = await request.json();
    const { id, exhibit_id, reporter_id, description } = data;

    const transaction = db.transaction(() => {
      const insertFault = db.prepare(`
        INSERT INTO fault_reports (id, exhibit_id, reporter_id, description, status)
        VALUES (?, ?, ?, ?, 'pending')
      `);
      insertFault.run(id, exhibit_id, reporter_id, description);

      const updateExhibit = db.prepare('UPDATE exhibits SET status = ? WHERE id = ?');
      updateExhibit.run('fault_pending', exhibit_id);

      const insertLog = db.prepare(`
        INSERT INTO operation_logs (id, type, operator_id, target_id, target_type, details)
        VALUES (?, 'fault_reported', ?, ?, 'fault_report', ?)
      `);
      const logId = `log-${Date.now()}`;
      const logDetails = `提交故障报修：${description}`;
      insertLog.run(logId, reporter_id, id, logDetails);
    });

    transaction();

    const fault = db.prepare(`
      SELECT
        f.*,
        e.name as exhibit_name,
        r.name as reporter_name
      FROM fault_reports f
      LEFT JOIN exhibits e ON f.exhibit_id = e.id
      LEFT JOIN users r ON f.reporter_id = r.id
      WHERE f.id = ?
    `).get(id);

    return json(fault, { status: 201 });
  } catch (error) {
    console.error('Failed to create fault:', error);
    return json({ error: 'Failed to create fault' }, { status: 500 });
  }
};
