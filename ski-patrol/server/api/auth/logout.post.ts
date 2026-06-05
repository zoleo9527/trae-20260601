export default defineEventHandler(async (event) => {
  deleteCookie(event, 'auth_token', { path: '/' })
  deleteCookie(event, 'user_id', { path: '/' })
  deleteCookie(event, 'user_role', { path: '/' })
  return { success: true }
})
