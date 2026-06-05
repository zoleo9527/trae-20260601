export default defineEventHandler(async (event) => {
  const userId = getCookie(event, 'user_id')
  const userRole = getCookie(event, 'user_role')

  if (!userId || !userRole) {
    return []
  }

  const db = getDb()
  const todos: any[] = []

  if (userRole === 'rental') {
    const pendingPatrols = db.prepare(`
      SELECT p.id, p.type, p.status, p.created_at, t.name as trail_name
      FROM patrols p
      LEFT JOIN trails t ON p.trail_id = t.id
      WHERE p.status = 'pending'
      ORDER BY p.created_at DESC
    `).all() as any[]
    pendingPatrols.forEach((p) => {
      todos.push({
        id: `patrol-${p.id}`,
        type: 'patrol',
        title: `${p.trail_name} - ${p.type === 'daily' ? '日常巡查' : '专项巡查'}`,
        status: p.status,
        createdAt: p.created_at,
        entityId: p.id,
      })
    })
  } else if (userRole === 'coach') {
    const pendingRisks = db.prepare(`
      SELECT r.id, r.level, r.urgency, r.status, r.created_at, t.name as trail_name
      FROM risks r
      LEFT JOIN patrols p ON r.patrol_id = p.id
      LEFT JOIN trails t ON p.trail_id = t.id
      WHERE r.status IN ('reported', 'resubmitted')
      ORDER BY r.created_at DESC
    `).all() as any[]
    pendingRisks.forEach((r) => {
      todos.push({
        id: `risk-${r.id}`,
        type: 'risk',
        title: `${r.trail_name} - 风险审批`,
        status: r.status,
        level: r.level,
        urgency: r.urgency,
        createdAt: r.created_at,
        entityId: r.id,
      })
    })
  } else if (userRole === 'patrol') {
    const pendingPatrols = db.prepare(`
      SELECT p.id, p.type, p.status, p.created_at, t.name as trail_name
      FROM patrols p
      LEFT JOIN trails t ON p.trail_id = t.id
      WHERE p.status IN ('pending', 'in_progress')
      ORDER BY p.created_at DESC
    `).all() as any[]
    pendingPatrols.forEach((p) => {
      todos.push({
        id: `patrol-${p.id}`,
        type: 'patrol',
        title: `${p.trail_name} - ${p.type === 'daily' ? '日常巡查' : '专项巡查'}`,
        status: p.status,
        createdAt: p.created_at,
        entityId: p.id,
      })
    })

    const rejectedRisks = db.prepare(`
      SELECT r.id, r.level, r.status, r.created_at, t.name as trail_name
      FROM risks r
      LEFT JOIN patrols p ON r.patrol_id = p.id
      LEFT JOIN trails t ON p.trail_id = t.id
      WHERE r.status = 'rejected'
      ORDER BY r.created_at DESC
    `).all() as any[]
    rejectedRisks.forEach((r) => {
      todos.push({
        id: `risk-rejected-${r.id}`,
        type: 'risk_resubmit',
        title: `${r.trail_name} - 风险补充（被退回）`,
        status: r.status,
        level: r.level,
        createdAt: r.created_at,
        entityId: r.id,
      })
    })
  }

  return todos
})
