export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: '缺少ID' })

  const body = await readBody(event)
  const { action, note } = body

  if (!action) throw createError({ statusCode: 400, message: '缺少审批动作' })

  const userId = getCookie(event, 'user_id')
  if (!userId) throw createError({ statusCode: 401, message: '未登录' })

  const userRole = getCookie(event, 'user_role')
  if (userRole !== 'coach') throw createError({ statusCode: 403, message: '仅教练主管可审批' })

  const db = getDb()
  const risk = db.prepare('SELECT * FROM risks WHERE id = ?').get(Number(id)) as any
  if (!risk) throw createError({ statusCode: 404, message: '风险记录不存在' })

  db.prepare(
    'UPDATE risks SET status = ?, approve_action = ?, approve_note = ?, resolved_at = datetime(\'now\', \'localtime\') WHERE id = ?'
  ).run('approved', action, note || null, Number(id))

  const actionLabel = action === 'reschedule' ? '改期' : '补录'
  addAuditLog(db, 'risk', Number(id), 'approve', Number(userId), `审批通过，处理方式: ${actionLabel}${note ? '，备注: ' + note : ''}`)

  return { success: true }
})
