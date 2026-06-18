import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import db from '$lib/server/db';

export const GET: RequestHandler = async ({ url }) => {
  try {
    const exhibitId = url.searchParams.get('exhibit_id');
    const inspectorId = url.searchParams.get('inspector_id');

    let query = `
      SELECT
        i.*,
        e.name as exhibit_name,
        e.location as exhibit_location,
        u.name as inspector_name
      FROM inspections i
      LEFT JOIN exhibits e ON i.exhibit_id = e.id
      LEFT JOIN users u ON i.inspector_id = u.id
    `;

    const conditions: string[] = [];
    const params: any[] = [];

    if (exhibitId) {
      conditions.push('i.exhibit_id = ?');
      params.push(exhibitId);
    }

    if (inspectorId) {
      conditions.push('i.inspector_id = ?');
      params.push(inspectorId);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY i.created_at DESC';

    const inspections = db.prepare(query).all(...params);

    return json(inspections);
  } catch (error) {
    console.error('Failed to fetch inspections:', error);
    return json({ error: 'Failed to fetch inspections' }, { status: 500 });
  }
};

export const POST: RequestHandler = async ({ request }) => {
  try {
    const data = await request.json();
    const { id, exhibit_id, inspector_id, result, notes } = data;

    const transaction = db.transaction(() => {
      const insertInspection = db.prepare(`
        INSERT INTO inspections (id, exhibit_id, inspector_id, result, notes)
        VALUES (?, ?, ?, ?, ?)
      `);
      insertInspection.run(id, exhibit_id, inspector_id, result, notes || null);

      const updateExhibit = db.prepare('UPDATE exhibits SET status = ? WHERE id = ?');
      const newStatus = result === 'normal' ? 'normal' : 'fault_pending';
      updateExhibit.run(newStatus, exhibit_id);

      const insertLog = db.prepare(`
        INSERT INTO operation_logs (id, type, operator_id, target_id, target_type, details)
        VALUES (?, 'inspection_submitted', ?, ?, 'inspection', ?)
      `);
      const logId = `log-${Date.now()}`;
      const logDetails = `展教员提交巡检：${result === 'normal' ? '正常' : '发现异常'}`;
      insertLog.run(logId, inspector_id, id, logDetails);

      if (result === 'abnormal') {
        const faultId = `fault-${Date.now()}`;
        const insertFault = db.prepare(`
          INSERT INTO fault_reports (id, exhibit_id, reporter_id, description, status)
          VALUES (?, ?, ?, ?, 'pending')
        `);
        insertFault.run(faultId, exhibit_id, inspector_id, notes || '展项异常，需设备工程师检修');

        const insertFaultLog = db.prepare(`
          INSERT INTO operation_logs (id, type, operator_id, target_id, target_type, details)
          VALUES (?, 'fault_reported', ?, ?, 'fault_report', ?)
        `);
        const faultLogId = `log-${Date.now() + 1}`;
        const faultLogDetails = `系统自动创建故障报修：${notes || '展项异常'}`;
        insertFaultLog.run(faultLogId, inspector_id, faultId, faultLogDetails);

        return { inspection: { id, exhibit_id, inspector_id, result, notes }, faultId };
      }

      return { inspection: { id, exhibit_id, inspector_id, result, notes }, faultId: null };
    });

    const result2 = transaction();

    return json(result2, { status: 201 });
  } catch (error) {
    console.error('Failed to create inspection:', error);
    return json({ error: 'Failed to create inspection' }, { status: 500 });
  }
};
