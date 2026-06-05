export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { trailId, type } = body

  if (!trailId || !type) {
    throw createError({ statusCode: 400, message: '缺少必填字段' })
  }

  const userId = getCookie(event, 'user_id')
  if (!userId) {
    throw createError({ statusCode: 401, message: '未登录' })
  }

  const db = getDb()
  const result = db.prepare(
    'INSERT INTO patrols (trail_id, creator_id, type, status) VALUES (?, ?, ?, ?)'
  ).run(trailId, Number(userId), type, 'pending')

  const patrolId = result.lastInsertRowid

  addAuditLog(db, 'patrol', Number(patrolId), 'create', Number(userId), `创建巡查单，雪道ID: ${trailId}，类型: ${type}`)

  return { id: patrolId, trailId, type, status: 'pending' }
})
