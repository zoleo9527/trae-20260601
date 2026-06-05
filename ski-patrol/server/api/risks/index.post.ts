export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { patrolId, level, description, urgency } = body

  if (!patrolId || !level || !description) {
    throw createError({ statusCode: 400, message: '缺少必填字段' })
  }

  const userId = getCookie(event, 'user_id')
  if (!userId) throw createError({ statusCode: 401, message: '未登录' })

  const db = getDb()
  const result = db.prepare(
    'INSERT INTO risks (patrol_id, level, description, urgency, status, creator_id) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(patrolId, level, description, urgency || 'normal', 'reported', Number(userId))

  const riskId = result.lastInsertRowid

  db.prepare('UPDATE patrols SET result = ? WHERE id = ? AND result IS NULL').run('issue', patrolId)

  addAuditLog(db, 'risk', Number(riskId), 'report', Number(userId), `上报风险，等级: ${level}，紧急程度: ${urgency || 'normal'}，描述: ${description}`)
  addAuditLog(db, 'patrol', patrolId, 'risk_reported', Number(userId), `巡查单关联风险上报 #${riskId}`)

  return { id: riskId, patrolId, level, status: 'reported' }
})
