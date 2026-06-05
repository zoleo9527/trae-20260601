export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: '缺少ID' })

  const db = getDb()
  const risk = db.prepare(`
    SELECT r.*, p.id as patrol_id, p.trail_id, p.result as patrol_result, p.conclusion as patrol_conclusion,
           t.name as trail_name, t.difficulty as trail_difficulty,
           u.name as creator_name
    FROM risks r
    LEFT JOIN patrols p ON r.patrol_id = p.id
    LEFT JOIN trails t ON p.trail_id = t.id
    LEFT JOIN users u ON r.creator_id = u.id
    WHERE r.id = ?
  `).get(Number(id)) as any

  if (!risk) throw createError({ statusCode: 404, message: '风险记录不存在' })

  const auditLogs = db.prepare(
    'SELECT a.*, u.name as operator_name, u.role as operator_role FROM audit_logs a LEFT JOIN users u ON a.operator_id = u.id WHERE a.entity_type = ? AND a.entity_id = ? ORDER BY a.created_at ASC'
  ).all('risk', Number(id)) as any[]

  const patrolLogs = db.prepare(
    'SELECT a.*, u.name as operator_name FROM audit_logs a LEFT JOIN users u ON a.operator_id = u.id WHERE a.entity_type = ? AND a.entity_id = ? ORDER BY a.created_at ASC'
  ).all('patrol', risk.patrol_id) as any[]

  return {
    id: risk.id,
    patrolId: risk.patrol_id,
    trailId: risk.trail_id,
    trailName: risk.trail_name,
    trailDifficulty: risk.trail_difficulty,
    patrolResult: risk.patrol_result,
    patrolConclusion: risk.patrol_conclusion,
    level: risk.level,
    description: risk.description,
    urgency: risk.urgency,
    status: risk.status,
    rejectReason: risk.reject_reason,
    supplementNote: risk.supplement_note,
    approveAction: risk.approve_action,
    approveNote: risk.approve_note,
    creatorName: risk.creator_name,
    createdAt: risk.created_at,
    resolvedAt: risk.resolved_at,
    archivedAt: risk.archived_at,
    auditLogs: auditLogs.map((l) => ({
      id: l.id,
      action: l.action,
      operatorName: l.operator_name,
      operatorRole: l.operator_role,
      detail: l.detail,
      createdAt: l.created_at,
    })),
    patrolAuditLogs: patrolLogs.map((l) => ({
      id: l.id,
      action: l.action,
      operatorName: l.operator_name,
      detail: l.detail,
      createdAt: l.created_at,
    })),
  }
})
