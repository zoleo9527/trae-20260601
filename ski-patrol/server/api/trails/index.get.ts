export default defineEventHandler(async (event) => {
  const db = getDb()
  const trails = db.prepare('SELECT * FROM trails ORDER BY id ASC').all()
  return trails
})
