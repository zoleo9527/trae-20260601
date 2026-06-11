import { json } from '@sveltejs/kit';
import { prepare, exec, STATUS, STATUS_TRANSITIONS, STATUS_META } from '$lib/server/db.js';

export async function POST({ params, request }) {
  const { to_status, operator_id, operator_role, remark } = await request.json();

  const reportStmt = prepare('SELECT * FROM maintenance_reports WHERE id = ?');
  const report = await reportStmt.get(params.id);

  if (!report) {
    return json({ error: '报告不存在' }, { status: 404 });
  }

  const allowedTransitions = STATUS_TRANSITIONS[report.current_status] || [];
  if (!allowedTransitions.includes(to_status)) {
    return json({
      error: `不允许从「${STATUS_META[report.current_status]?.label}」变更为「${STATUS_META[to_status]?.label}」`
    }, { status: 400 });
  }

  const expectedRole = STATUS_META[to_status]?.responsibleRole;
  if (expectedRole && operator_role !== expectedRole &&
      !(to_status === STATUS.REPORT_SUBMITTED && operator_role === 'inspector') &&
      !(to_status === STATUS.PENDING_SIGNATURE && operator_role === 'supervisor')) {
    return json({
      error: `「${operator_role}」无权执行此操作，当前状态应由「${expectedRole}」处理`
    }, { status: 403 });
  }

  const userStmt = prepare('SELECT * FROM users WHERE id = ?');
  const operator = await userStmt.get(operator_id);
  if (!operator) {
    return json({ error: '操作用户不存在' }, { status: 400 });
  }

  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

  await exec(`
    INSERT INTO status_transitions (
      report_id, from_status, to_status, operator_id, operator_role, remark, transition_time
    ) VALUES (
      ${params.id},
      ${report.current_status ? `'${report.current_status}'` : 'NULL'},
      '${to_status}',
      ${operator_id},
      '${operator_role}',
      '${(remark || '').replace(/'/g, "''")}',
      '${now}'
    );
    UPDATE maintenance_reports
    SET current_status = '${to_status}', updated_at = '${now}'
    WHERE id = ${params.id};
  `);

  const newTransitionSql = `
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

  const newTransitionStmt = prepare(newTransitionSql);
  const newTransition = await newTransitionStmt.get(params.id);

  return json({
    success: true,
    transition: {
      ...newTransition,
      from_status_label: newTransition.from_status ? (STATUS_META[newTransition.from_status]?.label || '创建') : null,
      to_status_label: STATUS_META[newTransition.to_status]?.label || newTransition.to_status,
      to_status_color: STATUS_META[newTransition.to_status]?.color || '#6b7280',
      operator_role_label: newTransition.operator_role === 'inspector' ? '巡检工程师' :
                            newTransition.operator_role === 'property' ? '物业联系人' :
                            newTransition.operator_role === 'supervisor' ? '维保主管' : newTransition.operator_role
    },
    new_status: {
      value: to_status,
      label: STATUS_META[to_status]?.label,
      color: STATUS_META[to_status]?.color,
      responsible_role: STATUS_META[to_status]?.responsibleRole
    }
  });
}
