import db from '../db.js'

interface ExceptionFilters {
  type?: string
  counterId?: number
}

export function getExceptions(filters: ExceptionFilters = {}) {
  const exceptionStatuses = ['pending_material', 'timeout_escalated', 'review_rejected']

  let sql = `
    SELECT a.*, s.name AS staffName, c.name AS counterName
    FROM attendance a
    LEFT JOIN staff s ON a.staffId = s.id
    LEFT JOIN counters c ON a.counterId = c.id
    WHERE a.status IN (${exceptionStatuses.map(() => '?').join(',')})
  `
  const params: unknown[] = [...exceptionStatuses]

  if (filters.type) {
    if (filters.type === 'pending_material') {
      sql += ' AND a.status = ?'
      params.push('pending_material')
    } else if (filters.type === 'timeout_escalated') {
      sql += ' AND a.status = ?'
      params.push('timeout_escalated')
    } else if (filters.type === 'review_rejected') {
      sql += ' AND a.status = ?'
      params.push('review_rejected')
    }
  }

  if (filters.counterId) {
    sql += ' AND a.counterId = ?'
    params.push(filters.counterId)
  }

  sql += ' ORDER BY a.date DESC'

  const records = db.prepare(sql).all(...params) as any[]
  const today = new Date().toISOString().split('T')[0]

  return records.map((r) => ({
    ...r,
    isOverdue: r.deadline ? r.deadline < today : false
  }))
}

export function getExceptionStats() {
  const types = ['pending_material', 'timeout_escalated', 'review_rejected'] as const
  const stats: Record<string, number> = {}

  for (const type of types) {
    const row = db.prepare(
      'SELECT COUNT(*) AS count FROM attendance WHERE status = ?'
    ).get(type) as any
    stats[type] = row?.count || 0
  }

  return stats
}
