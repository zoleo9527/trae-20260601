import { json } from '@sveltejs/kit';
import { prepare, exec, STATUS, STATUS_TRANSITIONS, STATUS_META, TRANSITION_OPERATOR_ROLES, ROLE_LABELS } from '$lib/server/db.js';

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
    SELECT r.*, b.property_manager_id, b.name as building_name
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
    return json({
      error: `操作角色不匹配：您的身份是「${ROLE_LABELS[operator.role] || operator.role}」，此操作需要「${ROLE_LABELS[expectedOperatorRole] || expectedOperatorRole}」身份`
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

  const fromResponsibleRole = report.current_status
    ? (STATUS_META[report.current_status]?.responsibleRole || null)
    : null;
  let fromResponsibleName = null;
  if (fromResponsibleRole === 'inspector') {
    const inspStmt = prepare('SELECT name FROM users WHERE id = ?');
    const insp = await inspStmt.get(report.inspector_id);
    fromResponsibleName = insp?.name || null;
  } else if (fromResponsibleRole === 'property') {
    const pmStmt = prepare('SELECT name FROM users WHERE id = ?');
    const pm = await pmStmt.get(report.property_manager_id);
    fromResponsibleName = pm?.name || null;
  } else if (fromResponsibleRole === 'supervisor') {
    const supStmt = prepare("SELECT name FROM users WHERE role = 'supervisor' ORDER BY id LIMIT 1");
    const sup = await supStmt.get();
    fromResponsibleName = sup?.name || null;
  }

  const toResponsibleRole = STATUS_META[to_status]?.responsibleRole || null;
  let toResponsibleName = null;
  if (toResponsibleRole === 'inspector') {
    const inspStmt = prepare('SELECT name FROM users WHERE id = ?');
    const insp = await inspStmt.get(report.inspector_id);
    toResponsibleName = insp?.name || null;
  } else if (toResponsibleRole === 'property') {
    const pmStmt = prepare('SELECT name FROM users WHERE id = ?');
    const pm = await pmStmt.get(report.property_manager_id);
    toResponsibleName = pm?.name || null;
  } else if (toResponsibleRole === 'supervisor') {
    const supStmt = prepare("SELECT name FROM users WHERE role = 'supervisor' ORDER BY id LIMIT 1");
    const sup = await supStmt.get();
    toResponsibleName = sup?.name || null;
  }

  const fromRespRoleSql = fromResponsibleRole ? `'${fromResponsibleRole}'` : 'NULL';
  const fromRespNameSql = fromResponsibleName ? `'${fromResponsibleName.replace(/'/g, "''")}'` : 'NULL';
  const toRespRoleSql = toResponsibleRole ? `'${toResponsibleRole}'` : 'NULL';
  const toRespNameSql = toResponsibleName ? `'${toResponsibleName.replace(/'/g, "''")}'` : 'NULL';

  await exec(`
    INSERT INTO status_transitions (
      report_id, from_status, to_status, operator_id, operator_role, remark, transition_time,
      from_responsible_role, from_responsible_name, to_responsible_role, to_responsible_name
    ) VALUES (
      ${params.id},
      ${report.current_status ? `'${report.current_status}'` : 'NULL'},
      '${to_status}',
      ${operator.id},
      '${operator.role}',
      '${(remark || '').replace(/'/g, "''")}',
      '${now}',
      ${fromRespRoleSql},
      ${fromRespNameSql},
      ${toRespRoleSql},
      ${toRespNameSql}
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
      from_status_color: newTransition.from_status ? (STATUS_META[newTransition.from_status]?.color || '#6b7280') : null,
      to_status_label: STATUS_META[newTransition.to_status]?.label || newTransition.to_status,
      to_status_color: STATUS_META[newTransition.to_status]?.color || '#6b7280',
      operator_role_label: ROLE_LABELS[newTransition.operator_role] || newTransition.operator_role,
      from_responsible_role_label: newTransition.from_responsible_role
        ? (ROLE_LABELS[newTransition.from_responsible_role] || newTransition.from_responsible_role)
        : null,
      to_responsible_role_label: newTransition.to_responsible_role
        ? (ROLE_LABELS[newTransition.to_responsible_role] || newTransition.to_responsible_role)
        : null
    },
    new_status: {
      value: to_status,
      label: STATUS_META[to_status]?.label,
      color: STATUS_META[to_status]?.color,
      responsible_role: STATUS_META[to_status]?.responsibleRole
    }
  });
}
