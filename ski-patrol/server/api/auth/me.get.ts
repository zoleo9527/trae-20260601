export default defineEventHandler(async (event) => {
  const userId = getCookie(event, 'user_id')
  const userRole = getCookie(event, 'user_role')

  if (!userId || !userRole) {
    throw createError({ statusCode: 401, message: '未登录' })
  }

  const db = getDb()
  const user = db.prepare('SELECT * FROM users WHERE id = ? AND role = ?').get(Number(userId), userRole) as any

  if (!user) {
    throw createError({ statusCode: 401, message: '用户不存在' })
  }

  return { id: user.id, name: user.name, role: user.role }
})
