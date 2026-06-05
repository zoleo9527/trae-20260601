export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const status = query.status as string | undefined
  const keyword = query.keyword as string | undefined

  const db = getDb()

  let sql = `
    SELECT p.*, t.name as trail_name, t.difficulty as trail_difficulty,
           u.name as creator_name, u.role as creator_role
    FROM patrols p
    LEFT JOIN trails t ON p.trail_id = t.id
    LEFT JOIN users u ON p.creator_id = u.id
    WHERE 1=1
  `
  const params: any[] = []

  if (status) {
    sql += ' AND p.status = ?'
    params.push(status)
  }

  if (keyword) {
    sql += ' AND t.name LIKE ?'
    params.push(`%${keyword}%`)
  }

  sql += ' ORDER BY p.created_at DESC'

  const patrols = db.prepare(sql).all(...params) as any[]

  return patrols.map((p) => ({
    id: p.id,
    trailId: p.trail_id,
    trailName: p.trail_name,
    trailDifficulty: p.trail_difficulty,
    creatorId: p.creator_id,
    creatorName: p.creator_name,
    creatorRole: p.creator_role,
    type: p.type,
    status: p.status,
    result: p.result,
    conclusion: p.conclusion,
    createdAt: p.created_at,
    completedAt: p.completed_at,
    archivedAt: p.archived_at,
  }))
})
