export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: '缺少ID' })

  const userId = getCookie(event, 'user_id')
  if (!userId) throw createError({ statusCode: 401, message: '未登录' })

  const db = getDb()
  const patrol = db.prepare('SELECT * FROM patrols WHERE id = ?').get(Number(id)) as any
  if (!patrol) throw createError({ statusCode: 404, message: '巡查记录不存在' })

  db.prepare(
    'UPDATE patrols SET status = ?, archived_at = datetime(\'now\', \'localtime\') WHERE id = ?'
  ).run('archived', Number(id))

  addAuditLog(db, 'patrol', Number(id), 'archive', Number(userId), '巡查记录已归档')

  return { success: true }
})
