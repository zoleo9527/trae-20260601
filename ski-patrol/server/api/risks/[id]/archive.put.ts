export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: '缺少ID' })

  const userId = getCookie(event, 'user_id')
  if (!userId) throw createError({ statusCode: 401, message: '未登录' })

  const db = getDb()
  const risk = db.prepare('SELECT * FROM risks WHERE id = ?').get(Number(id)) as any
  if (!risk) throw createError({ statusCode: 404, message: '风险记录不存在' })

  db.prepare(
    'UPDATE risks SET status = ?, archived_at = datetime(\'now\', \'localtime\') WHERE id = ?'
  ).run('archived', Number(id))

  addAuditLog(db, 'risk', Number(id), 'archive', Number(userId), '风险记录已归档')

  return { success: true }
})
