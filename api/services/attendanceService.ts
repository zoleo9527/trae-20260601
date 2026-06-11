import db from '../db.js'
import { logOperation } from './logService.js'

interface AttendanceFilters {
  status?: string
  date?: string
  counterId?: number
  staffId?: number
}

export function getAttendanceList(filters: AttendanceFilters = {}) {
  let sql = `
    SELECT a.*, s.name AS staffName, c.name AS counterName
    FROM attendance a
    LEFT JOIN staff s ON a.staffId = s.id
    LEFT JOIN counters c ON a.counterId = c.id
    WHERE 1=1
  `
  const params: unknown[] = []

  if (filters.status) {
    sql += ' AND a.status = ?'
    params.push(filters.status)
  }
  if (filters.date) {
    sql += ' AND a.date = ?'
    params.push(filters.date)
  }
  if (filters.counterId) {
    sql += ' AND a.counterId = ?'
    params.push(filters.counterId)
  }
  if (filters.staffId) {
    sql += ' AND a.staffId = ?'
    params.push(filters.staffId)
  }

  sql += ' ORDER BY a.date DESC, a.shift ASC'

  return db.prepare(sql).all(...params)
}

export function confirmAttendance(id: number, operatorId: number) {
  const att = db.prepare('SELECT * FROM attendance WHERE id = ?').get(id) as any
  if (!att) throw new Error('考勤记录不存在')
  if (att.status !== 'pending_confirm') throw new Error('当前状态不允许确认')

  const now = new Date().toISOString()
  db.prepare(`
    UPDATE attendance SET status = 'pending_review', confirmedAt = ?, currentResponsible = ?, updatedAt = ?
    WHERE id = ?
  `).run(now, getFloorSupervisorId(), now, id)

  const operator = db.prepare('SELECT name FROM staff WHERE id = ?').get(operatorId) as any
  logOperation({
    operatorId,
    operatorName: operator?.name || '',
    action: 'confirm_attendance',
    entityType: 'attendance',
    entityId: id,
    detail: '导购确认考勤'
  })

  return db.prepare('SELECT * FROM attendance WHERE id = ?').get(id)
}

export function markException(id: number, operatorId: number, exceptionType: string, note: string) {
  const att = db.prepare('SELECT * FROM attendance WHERE id = ?').get(id) as any
  if (!att) throw new Error('考勤记录不存在')

  const now = new Date().toISOString()
  let newStatus: string
  if (exceptionType === 'material') {
    newStatus = 'pending_material'
  } else {
    newStatus = att.status
  }

  db.prepare(`
    UPDATE attendance SET status = ?, exceptionType = ?, exceptionNote = ?, updatedAt = ?
    WHERE id = ?
  `).run(newStatus, exceptionType, note, now, id)

  const operator = db.prepare('SELECT name FROM staff WHERE id = ?').get(operatorId) as any
  logOperation({
    operatorId,
    operatorName: operator?.name || '',
    action: 'mark_exception',
    entityType: 'attendance',
    entityId: id,
    detail: `标记异常: ${exceptionType} - ${note}`
  })

  return db.prepare('SELECT * FROM attendance WHERE id = ?').get(id)
}

export function submitMaterial(id: number, operatorId: number) {
  const att = db.prepare('SELECT * FROM attendance WHERE id = ?').get(id) as any
  if (!att) throw new Error('考勤记录不存在')
  if (att.status !== 'pending_material') throw new Error('当前状态不允许提交材料')

  const now = new Date().toISOString()
  db.prepare(`
    UPDATE attendance SET status = 'pending_review', exceptionType = 'material_submitted', currentResponsible = ?, updatedAt = ?
    WHERE id = ?
  `).run(getFloorSupervisorId(), now, id)

  const operator = db.prepare('SELECT name FROM staff WHERE id = ?').get(operatorId) as any
  logOperation({
    operatorId,
    operatorName: operator?.name || '',
    action: 'submit_material',
    entityType: 'attendance',
    entityId: id,
    detail: '提交材料，转为待复核'
  })

  return db.prepare('SELECT * FROM attendance WHERE id = ?').get(id)
}

export function escalateTimeout(id: number, supervisorId: number) {
  const att = db.prepare('SELECT * FROM attendance WHERE id = ?').get(id) as any
  if (!att) throw new Error('考勤记录不存在')
  if (att.status !== 'timeout_escalated' && att.status !== 'pending_confirm') throw new Error('当前状态不允许此操作')

  const now = new Date().toISOString()

  if (att.status === 'pending_confirm') {
    db.prepare(`
      UPDATE attendance SET status = 'timeout_escalated', currentResponsible = ?, updatedAt = ?
      WHERE id = ?
    `).run(supervisorId, now, id)

    const operator = db.prepare('SELECT name FROM staff WHERE id = ?').get(supervisorId) as any
    logOperation({
      operatorId: supervisorId,
      operatorName: operator?.name || '',
      action: 'escalate_timeout',
      entityType: 'attendance',
      entityId: id,
      detail: '确认超时，升级至楼层主管'
    })
  } else {
    db.prepare(`
      UPDATE attendance SET status = 'pending_review', confirmedAt = ?, currentResponsible = ?, updatedAt = ?
      WHERE id = ?
    `).run(now, supervisorId, now, id)

    const operator = db.prepare('SELECT name FROM staff WHERE id = ?').get(supervisorId) as any
    logOperation({
      operatorId: supervisorId,
      operatorName: operator?.name || '',
      action: 'confirm_on_behalf',
      entityType: 'attendance',
      entityId: id,
      detail: '楼层主管代确认，转为待复核'
    })
  }

  return db.prepare('SELECT * FROM attendance WHERE id = ?').get(id)
}

export function resubmitAfterReject(id: number, operatorId: number) {
  const att = db.prepare('SELECT * FROM attendance WHERE id = ?').get(id) as any
  if (!att) throw new Error('考勤记录不存在')
  if (att.status !== 'review_rejected') throw new Error('当前状态不允许重提')

  const now = new Date().toISOString()
  db.prepare(`
    UPDATE attendance SET status = 'pending_review', currentResponsible = ?, rejectedReason = ?, updatedAt = ?
    WHERE id = ?
  `).run(getFloorSupervisorId(), null, now, id)

  const operator = db.prepare('SELECT name FROM staff WHERE id = ?').get(operatorId) as any
  logOperation({
    operatorId,
    operatorName: operator?.name || '',
    action: 'resubmit_attendance',
    entityType: 'attendance',
    entityId: id,
    detail: '柜长修正后重新提交复核'
  })

  return db.prepare('SELECT * FROM attendance WHERE id = ?').get(id)
}

function getFloorSupervisorId(): number {
  const row = db.prepare("SELECT id FROM staff WHERE role = 'floor_supervisor' LIMIT 1").get() as any
  return row?.id || 2
}
