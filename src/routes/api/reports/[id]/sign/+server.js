import { json } from '@sveltejs/kit';
import { prepare, exec, STATUS, STATUS_META } from '$lib/server/db.js';

export async function POST({ params, request }) {
  const { signatory_id, signature_data, remark } = await request.json();

  if (!signatory_id) {
    return json({ error: '缺少签收人ID' }, { status: 400 });
  }

  const userStmt = prepare('SELECT * FROM users WHERE id = ?');
  const signatory = await userStmt.get(signatory_id);
  if (!signatory) {
    return json({ error: '签收用户不存在' }, { status: 400 });
  }

  const reportSql = `
    SELECT r.*, b.property_manager_id, u.name as property_manager_name
    FROM maintenance_reports r
    JOIN buildings b ON r.building_id = b.id
    LEFT JOIN users u ON b.property_manager_id = u.id
    WHERE r.id = ?
  `;
  const reportStmt = prepare(reportSql);
  const report = await reportStmt.get(params.id);

  if (!report) {
    return json({ error: '报告不存在' }, { status: 404 });
  }

  if (report.current_status !== STATUS.PENDING_SIGNATURE) {
    return json({
      error: `当前状态为「${STATUS_META[report.current_status]?.label}」，不允许签收`
    }, { status: 400 });
  }

  if (signatory.role !== 'property') {
    return json({ error: '只有物业联系人可以签收' }, { status: 403 });
  }

  if (!report.property_manager_id) {
    return json({ error: '此楼宇未指定物业联系人' }, { status: 403 });
  }

  if (report.property_manager_id !== signatory.id) {
    return json({
      error: `签收人不匹配：此楼宇的物业联系人为「${report.property_manager_name || '未设置'}」，您「${signatory.name}」无权签收`,
      expected_signatory: report.property_manager_name,
      actual_signatory: signatory.name
    }, { status: 403 });
  }

  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

  await exec(`
    INSERT INTO signature_records (
      report_id, signatory_id, signatory_name, signature_data, remark, signed_at
    ) VALUES (
      ${params.id},
      ${signatory.id},
      '${signatory.name}',
      ${signature_data ? `'${signature_data.replace(/'/g, "''")}'` : 'NULL'},
      '${(remark || '').replace(/'/g, "''")}',
      '${now}'
    );
    INSERT INTO status_transitions (
      report_id, from_status, to_status, operator_id, operator_role, remark, transition_time
    ) VALUES (
      ${params.id},
      '${report.current_status}',
      '${STATUS.SIGNED}',
      ${signatory.id},
      '${signatory.role}',
      '${(remark || '客户已签收').replace(/'/g, "''")}',
      '${now}'
    );
    UPDATE maintenance_reports
    SET current_status = '${STATUS.SIGNED}', updated_at = '${now}'
    WHERE id = ${params.id};
  `);

  const signatureSql = `SELECT * FROM signature_records WHERE report_id = ? ORDER BY signed_at DESC LIMIT 1`;
  const signatureStmt = prepare(signatureSql);
  const signature = await signatureStmt.get(params.id);

  const transitionSql = `
    SELECT
      st.*,
      u.name as operator_name,
      u.department as operator_department
    FROM status_transitions st
    JOIN users u ON st.operator_id = u.id
    WHERE st.report_id = ?
    ORDER BY st.transition_time DESC
    LIMIT 1
  `;

  const transitionStmt = prepare(transitionSql);
  const transition = await transitionStmt.get(params.id);

  return json({
    success: true,
    signature,
    transition: {
      ...transition,
      from_status_label: STATUS_META[transition.from_status]?.label,
      from_status_color: STATUS_META[transition.from_status]?.color,
      to_status_label: STATUS_META[transition.to_status]?.label,
      to_status_color: STATUS_META[transition.to_status]?.color,
      operator_role_label: '物业联系人'
    }
  });
}
