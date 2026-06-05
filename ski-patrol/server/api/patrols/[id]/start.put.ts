export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: '缺少ID' })

  const userId = getCookie(event, 'user_id')
  if (!userId) throw createError({ statusCode: 401, message: '未登录' })

  const db = getDb()
  const patrol = db.prepare('SELECT * FROM patrols WHERE id = ?').get(Number(id)) as any
  if (!patrol) throw createError({ statusCode: 404, message: '巡查记录不存在' })

  if (patrol.status !== 'pending') {
    throw createError({ statusCode: 400, message: '仅待巡查状态可开始' })
  }

  db.prepare('UPDATE patrols SET status = ? WHERE id = ?').run('in_progress', Number(id))

  addAuditLog(db, 'patrol', Number(id), 'start', Number(userId), '开始巡查')

  return { success: true }
})
