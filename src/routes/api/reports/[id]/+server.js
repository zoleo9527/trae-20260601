import { json } from '@sveltejs/kit';
import { prepare, STATUS_META } from '$lib/server/db.js';

export async function GET({ params }) {
  const reportSql = `
    SELECT
      r.*,
      b.name as building_name, b.address, b.property_manager_id,
      u.name as inspector_name, u.phone as inspector_phone, u.department as inspector_department,
      pm.name as property_manager_name, pm.phone as property_manager_phone
    FROM maintenance_reports r
    JOIN buildings b ON r.building_id = b.id
    JOIN users u ON r.inspector_id = u.id
    LEFT JOIN users pm ON b.property_manager_id = pm.id
    WHERE r.id = ?
  `;

  const reportStmt = prepare(reportSql);
  const report = await reportStmt.get(params.id);

  if (!report) {
    return json({ error: '报告不存在' }, { status: 404 });
  }

  const transitionsSql = `
    SELECT
      st.*,
      u.name as operator_name,
      u.department as operator_department
    FROM status_transitions st
    JOIN users u ON st.operator_id = u.id
    WHERE st.report_id = ?
    ORDER BY st.transition_time ASC
  `;

  const transitionsStmt = prepare(transitionsSql);
  const transitions = await transitionsStmt.all(params.id);

  for (const t of transitions) {
    t.from_status_label = t.from_status ? STATUS_META[t.from_status]?.label : '创建' : null;
    t.to_status_label = STATUS_META[t.to_status]?.label || t.to_status;
    t.to_status_color = STATUS_META[t.to_status]?.color || '#6b7280';
    t.operator_role_label = t.operator_role === 'inspector' ? '巡检工程师' :
                            t.operator_role === 'property' ? '物业联系人' :
                            t.operator_role === 'supervisor' ? '维保主管' : t.operator_role;
  }

  const signatureSql = `SELECT * FROM signature_records WHERE report_id = ? ORDER BY signed_at DESC`;
  const signatureStmt = prepare(signatureSql);
  const signatures = await signatureStmt.all(params.id);

  return json({
    report: {
      ...report,
      status_label: STATUS_META[report.current_status]?.label || report.current_status,
      status_color: STATUS_META[report.current_status]?.color || '#6b7280',
      responsible_role: STATUS_META[report.current_status]?.responsibleRole
    },
    transitions,
    signatures
  });
}
