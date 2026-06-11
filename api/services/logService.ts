import db from '../db.js'

interface LogParams {
  operatorId: number
  operatorName: string
  action: string
  entityType: string
  entityId: number
  detail: string
}

export function logOperation(params: LogParams): void {
  const stmt = db.prepare(`
    INSERT INTO operation_logs (operatorId, operatorName, action, entityType, entityId, detail, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)
  stmt.run(
    params.operatorId,
    params.operatorName,
    params.action,
    params.entityType,
    params.entityId,
    params.detail,
    new Date().toISOString()
  )
}

interface LogFilters {
  operatorId?: number
  entityType?: string
  dateRange?: { start: string; end: string }
}

export function getLogs(filters: LogFilters = {}) {
  let sql = 'SELECT * FROM operation_logs WHERE 1=1'
  const params: unknown[] = []

  if (filters.operatorId) {
    sql += ' AND operatorId = ?'
    params.push(filters.operatorId)
  }
  if (filters.entityType) {
    sql += ' AND entityType = ?'
    params.push(filters.entityType)
  }
  if (filters.dateRange) {
    sql += ' AND createdAt >= ? AND createdAt <= ?'
    params.push(filters.dateRange.start, filters.dateRange.end + 'T23:59:59')
  }

  sql += ' ORDER BY createdAt DESC'

  return db.prepare(sql).all(...params)
}
