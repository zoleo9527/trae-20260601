export default defineEventHandler(async (event) => {
  resetDb()
  return { success: true }
})
