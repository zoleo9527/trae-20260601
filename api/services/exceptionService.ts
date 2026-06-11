import db from '../db.js'

interface ExceptionFilters {
  type?: string
  counterId?: number
  staffId?: number
  brandId?: number
  role?: string
  userId?: number
}

function applyRoleScoping(sql: string, params: unknown[], filters: ExceptionFilters): { sql: string; params: unknown[] } {
  if (filters.role === 'counter_manager' && filters.userId) {
    const staff = db.prepare('SELECT counterId FROM staff WHERE id = ? AND role = ?').get(filters.userId, filters.role) as any
    if (staff?.counterId) {
      sql += ' AND a.counterId = ?'
      params.push(staff.counterId)
    }
  } else if (filters.counterId) {
    sql += ' AND a.counterId = ?'
    params.push(filters.counterId)
  }

  if (filters.role === 'brand_supervisor' && filters.userId) {
    const staff = db.prepare('SELECT brandId FROM staff WHERE id = ? AND role = ?').get(filters.userId, filters.role) as any
    if (staff?.brandId) {
      sql += ' AND a.counterId IN (SELECT id FROM counters WHERE id = ? OR brand = (SELECT brand FROM counters WHERE id = ?))'
      params.push(staff.brandId, staff.brandId)
    }
  } else if (filters.brandId) {
    sql += ' AND a.counterId IN (SELECT id FROM counters WHERE id = ? OR brand = (SELECT brand FROM counters WHERE id = ?))'
    params.push(filters.brandId, filters.brandId)
  }

  if (filters.role === 'guide' && filters.userId) {
    sql += ' AND a.staffId = ?'
    params.push(filters.userId)
  } else if (filters.staffId) {
    sql += ' AND a.staffId = ?'
    params.push(filters.staffId)
  }

  return { sql, params }
}

export function getExceptions(filters: ExceptionFilters = {}) {
  const exceptionStatuses = ['pending_material', 'timeout_escalated', 'review_rejected', 'submitted']

  let sql = `
    SELECT a.*, s.name AS staffName, c.name AS counterName, c.brand AS counterBrand
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
    } else if (filters.type === 'submitted') {
      sql += ' AND a.status = ?'
      params.push('submitted')
    }
  }

  const scoped = applyRoleScoping(sql, params, filters)
  sql = scoped.sql
  params.splice(0, params.length, ...scoped.params)

  sql += ' ORDER BY a.date DESC'

  const records = db.prepare(sql).all(...params) as any[]
  const today = new Date().toISOString().split('T')[0]

  return records.map((r) => ({
    ...r,
    isOverdue: r.deadline ? r.deadline < today : false
  }))
}

export function getExceptionStats(role?: string, userId?: number) {
  const types = ['pending_material', 'timeout_escalated', 'review_rejected', 'submitted'] as const
  const stats: Record<string, number> = {}

  let counterScope: number | null = null
  let brandScope: number | null = null
  let staffScope: number | null = null

  if (role === 'counter_manager' && userId) {
    const s = db.prepare('SELECT counterId FROM staff WHERE id = ? AND role = ?').get(userId, role) as any
    counterScope = s?.counterId || null
  } else if (role === 'brand_supervisor' && userId) {
    const s = db.prepare('SELECT brandId FROM staff WHERE id = ? AND role = ?').get(userId, role) as any
    brandScope = s?.brandId || null
  } else if (role === 'guide' && userId) {
    staffScope = userId
  }

  for (const type of types) {
    let sql = 'SELECT COUNT(*) AS count FROM attendance WHERE status = ?'
    const params: unknown[] = [type]

    if (counterScope) {
      sql += ' AND counterId = ?'
      params.push(counterScope)
    }
    if (brandScope) {
      sql += ' AND counterId IN (SELECT id FROM counters WHERE id = ? OR brand = (SELECT brand FROM counters WHERE id = ?))'
      params.push(brandScope, brandScope)
    }
    if (staffScope) {
      sql += ' AND staffId = ?'
      params.push(staffScope)
    }

    const row = db.prepare(sql).get(...params) as any
    stats[type] = row?.count || 0
  }

  return stats
}

export function getAttendanceTrail(attendanceId: number) {
  const logs = db.prepare(`
    SELECT id, operatorId, operatorName, operatorRole, action, fromStatus, toStatus, detail, createdAt
    FROM operation_logs
    WHERE entityType = 'attendance' AND entityId = ?
    ORDER BY createdAt ASC, id ASC
  `).all(attendanceId)

  const reviews = db.prepare(`
    SELECT id, attendanceId, reviewerId, reviewerRole, action, reason, createdAt
    FROM reviews
    WHERE attendanceId = ?
    ORDER BY createdAt ASC, id ASC
  `).all(attendanceId)

  return { logs, reviews }
}
