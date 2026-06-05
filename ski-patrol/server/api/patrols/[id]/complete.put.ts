export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: '缺少ID' })

  const body = await readBody(event)
  const { result, conclusion } = body

  if (!result || !conclusion) {
    throw createError({ statusCode: 400, message: '缺少巡查结果或结论' })
  }

  const userId = getCookie(event, 'user_id')
  if (!userId) throw createError({ statusCode: 401, message: '未登录' })

  const db = getDb()
  const patrol = db.prepare('SELECT * FROM patrols WHERE id = ?').get(Number(id)) as any
  if (!patrol) throw createError({ statusCode: 404, message: '巡查记录不存在' })

  db.prepare(
    'UPDATE patrols SET status = ?, result = ?, conclusion = ?, completed_at = datetime(\'now\', \'localtime\') WHERE id = ?'
  ).run('completed', result, conclusion, Number(id))

  addAuditLog(db, 'patrol', Number(id), 'complete', Number(userId), `完成巡查，结果: ${result === 'normal' ? '正常' : '有问题'}，结论: ${conclusion}`)

  return { success: true }
})
