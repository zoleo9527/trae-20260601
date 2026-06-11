import { json } from '@sveltejs/kit';
import { prepare, exec, STATUS, STATUS_TRANSITIONS, STATUS_META, TRANSITION_OPERATOR_ROLES } from '$lib/server/db.js';

export async function POST({ params, request }) {
  const { to_status, operator_id, remark } = await request.json();

  if (!operator_id) {
    return json({ error: '缺少操作人ID' }, { status: 400 });
  }

  const userStmt = prepare('SELECT * FROM users WHERE id = ?');
  const operator = await userStmt.get(operator_id);
  if (!operator) {
    return json({ error: '操作用户不存在' }, { status: 400 });
  }

  const reportSql = `
    SELECT r.*, b.property_manager_id
    FROM maintenance_reports r
    JOIN buildings b ON r.building_id = b.id
    WHERE r.id = ?
  `;
  const reportStmt = prepare(reportSql);
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

  const expectedOperatorRole = TRANSITION_OPERATOR_ROLES[to_status];
  if (expectedOperatorRole && operator.role !== expectedOperatorRole) {
    const roleLabel = operator.role === 'inspector' ? '巡检工程师' :
                      operator.role === 'property' ? '物业联系人' :
                      operator.role === 'supervisor' ? '维保主管' : operator.role;
    const expectedLabel = expectedOperatorRole === 'inspector' ? '巡检工程师' :
                          expectedOperatorRole === 'property' ? '物业联系人' :
                          expectedOperatorRole === 'supervisor' ? '维保主管' : expectedOperatorRole;
    return json({
      error: `操作角色不匹配：您的身份是「${roleLabel}」，此操作需要「${expectedLabel}」身份`
    }, { status: 403 });
  }

  if (to_status === STATUS.DISPUTED) {
    if (!report.property_manager_id) {
      return json({ error: '此楼宇未指定物业联系人' }, { status: 403 });
    }
    if (report.property_manager_id !== operator.id) {
      return json({
        error: `只有此楼宇的物业联系人才能提出异议，您不是该楼宇的物业联系人`
      }, { status: 403 });
    }
  }

  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

  await exec(`
    INSERT INTO status_transitions (
      report_id, from_status, to_status, operator_id, operator_role, remark, transition_time
    ) VALUES (
      ${params.id},
      ${report.current_status ? `'${report.current_status}'` : 'NULL'},
      '${to_status}',
      ${operator.id},
      '${operator.role}',
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
