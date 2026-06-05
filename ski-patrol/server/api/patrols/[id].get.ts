export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: '缺少ID' })

  const db = getDb()
  const patrol = db.prepare(`
    SELECT p.*, t.name as trail_name, t.difficulty as trail_difficulty, t.status as trail_status,
           u.name as creator_name, u.role as creator_role
    FROM patrols p
    LEFT JOIN trails t ON p.trail_id = t.id
    LEFT JOIN users u ON p.creator_id = u.id
    WHERE p.id = ?
  `).get(Number(id)) as any

  if (!patrol) throw createError({ statusCode: 404, message: '巡查记录不存在' })

  const auditLogs = db.prepare(
    'SELECT a.*, u.name as operator_name FROM audit_logs a LEFT JOIN users u ON a.operator_id = u.id WHERE a.entity_type = ? AND a.entity_id = ? ORDER BY a.created_at ASC'
  ).all('patrol', Number(id)) as any[]

  const risks = db.prepare(`
    SELECT r.*, u.name as reporter_name
    FROM risks r
    LEFT JOIN users u ON r.creator_id = u.id
    WHERE r.patrol_id = ?
    ORDER BY r.created_at DESC
  `).all(Number(id)) as any[]

  return {
    id: patrol.id,
    trailId: patrol.trail_id,
    trailName: patrol.trail_name,
    trailDifficulty: patrol.trail_difficulty,
    trailStatus: patrol.trail_status,
    creatorId: patrol.creator_id,
    creatorName: patrol.creator_name,
    creatorRole: patrol.creator_role,
    type: patrol.type,
    status: patrol.status,
    result: patrol.result,
    conclusion: patrol.conclusion,
    createdAt: patrol.created_at,
    completedAt: patrol.completed_at,
    archivedAt: patrol.archived_at,
    auditLogs: auditLogs.map((l) => ({
      id: l.id,
      action: l.action,
      operatorName: l.operator_name,
      detail: l.detail,
      createdAt: l.created_at,
    })),
    risks: risks.map((r) => ({
      id: r.id,
      level: r.level,
      description: r.description,
      urgency: r.urgency,
      status: r.status,
      createdAt: r.created_at,
    })),
  }
})
