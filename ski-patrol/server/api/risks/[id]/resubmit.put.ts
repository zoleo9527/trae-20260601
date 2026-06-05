export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: '缺少ID' })

  const body = await readBody(event)
  const { supplementNote } = body

  if (!supplementNote) throw createError({ statusCode: 400, message: '缺少补充备注' })

  const userId = getCookie(event, 'user_id')
  if (!userId) throw createError({ statusCode: 401, message: '未登录' })

  const db = getDb()
  const risk = db.prepare('SELECT * FROM risks WHERE id = ?').get(Number(id)) as any
  if (!risk) throw createError({ statusCode: 404, message: '风险记录不存在' })

  if (risk.status !== 'rejected') throw createError({ statusCode: 400, message: '仅被退回的风险可重新提交' })

  db.prepare(
    'UPDATE risks SET status = ?, supplement_note = ? WHERE id = ?'
  ).run('resubmitted', supplementNote, Number(id))

  addAuditLog(db, 'risk', Number(id), 'resubmit', Number(userId), `重新提交风险上报，补充备注: ${supplementNote}`)

  return { success: true }
})
