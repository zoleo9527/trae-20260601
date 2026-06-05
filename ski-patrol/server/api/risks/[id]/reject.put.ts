export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: '缺少ID' })

  const body = await readBody(event)
  const { reason } = body

  if (!reason) throw createError({ statusCode: 400, message: '缺少退回原因' })

  const userId = getCookie(event, 'user_id')
  if (!userId) throw createError({ statusCode: 401, message: '未登录' })

  const userRole = getCookie(event, 'user_role')
  if (userRole !== 'coach') throw createError({ statusCode: 403, message: '仅教练主管可退回风险上报' })

  const db = getDb()
  const risk = db.prepare('SELECT * FROM risks WHERE id = ?').get(Number(id)) as any
  if (!risk) throw createError({ statusCode: 404, message: '风险记录不存在' })

  db.prepare(
    'UPDATE risks SET status = ?, reject_reason = ? WHERE id = ?'
  ).run('rejected', reason, Number(id))

  addAuditLog(db, 'risk', Number(id), 'reject', Number(userId), `退回风险上报，原因: ${reason}`)

  return { success: true }
})
