export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const role = query.role as string | undefined

  if (!role || !['rental', 'coach', 'patrol'].includes(role)) {
    throw createError({ statusCode: 400, message: '无效的角色类型' })
  }

  const db = getDb()
  const user = db.prepare('SELECT * FROM users WHERE role = ?').get(role) as any

  if (!user) {
    throw createError({ statusCode: 404, message: '用户不存在' })
  }

  const token = `demo-${role}-${Date.now()}`

  setCookie(event, 'auth_token', token, {
    httpOnly: false,
    maxAge: 60 * 60 * 24,
    path: '/',
  })
  setCookie(event, 'user_id', String(user.id), {
    httpOnly: false,
    maxAge: 60 * 60 * 24,
    path: '/',
  })
  setCookie(event, 'user_role', user.role, {
    httpOnly: false,
    maxAge: 60 * 60 * 24,
    path: '/',
  })

  return {
    token,
    user: { id: user.id, name: user.name, role: user.role },
  }
})
