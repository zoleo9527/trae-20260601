import { json } from '@sveltejs/kit';
import { prepare, STATUS_META, ROLES } from '$lib/server/db.js';

export async function GET({ url }) {
  const role = url.searchParams.get('role') || 'supervisor';
  const userId = parseInt(url.searchParams.get('userId')) || 1;
  const status = url.searchParams.get('status');

  let whereClause = 'WHERE 1=1';
  const params = [];

  if (status) {
    whereClause += ' AND r.current_status = ?';
    params.push(status);
  }

  if (role === ROLES.INSPECTOR) {
    whereClause += ' AND r.inspector_id = ?';
    params.push(userId);
  } else if (role === ROLES.PROPERTY) {
    whereClause += ' AND b.property_manager_id = ?';
    params.push(userId);
  }

  const sql = `
    SELECT
      r.id, r.report_no, r.current_status, r.inspection_date,
      r.problems_found,
      b.name as building_name, b.address,
      u.name as inspector_name
    FROM maintenance_reports r
    JOIN buildings b ON r.building_id = b.id
    JOIN users u ON r.inspector_id = u.id
    ${whereClause}
    ORDER BY r.updated_at DESC
  `;

  const stmt = prepare(sql);
  const reports = await stmt.all(...params);

  const countSql = `SELECT COUNT(*) as cnt FROM status_transitions WHERE report_id = ?`;
  const countStmt = prepare(countSql);

  for (const r of reports) {
    const countResult = await countStmt.get(r.id);
    r.transition_count = countResult?.cnt || 0;
    r.status_label = STATUS_META[r.current_status]?.label || r.current_status;
    r.status_color = STATUS_META[r.current_status]?.color || '#6b7280';
    r.responsible_role = STATUS_META[r.current_status]?.responsibleRole;
  }

  return json({ reports });
}
