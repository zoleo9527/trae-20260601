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

export function approveAttendanceSubmitted(id: number, operatorId: number) {
  const att = db.prepare('SELECT * FROM attendance WHERE id = ?').get(id) as any
  if (!att) throw new Error('考勤记录不存在')
  if (att.status !== 'submitted') throw new Error('当前状态不允许此操作')

  const operator = db.prepare('SELECT id, name, role, counterId FROM staff WHERE id = ?').get(operatorId) as any
  if (!operator) throw new Error('操作员不存在')
  if (operator.role !== 'counter_manager' || operator.counterId !== att.counterId) {
    throw new Error('只有对应专柜的柜长才能审核排班考勤')
  }

  const now = new Date().toISOString()
  db.prepare(`
    UPDATE attendance SET status = 'pending_confirm', currentResponsible = ?, updatedAt = ?
    WHERE id = ?
  `).run(att.staffId, now, id)

  logOperation({
    operatorId,
    operatorName: operator.name,
    operatorRole: operator.role,
    action: 'approve_attendance_submitted',
    entityType: 'attendance',
    entityId: id,
    fromStatus: 'submitted',
    toStatus: 'pending_confirm',
    detail: '柜长确认排班无误，下发导购确认'
  })

  return db.prepare('SELECT * FROM attendance WHERE id = ?').get(id)
}

export function confirmAttendance(id: number, operatorId: number) {
  const att = db.prepare('SELECT * FROM attendance WHERE id = ?').get(id) as any
  if (!att) throw new Error('考勤记录不存在')
  if (att.status !== 'pending_confirm') throw new Error('当前状态不允许确认')

  const operator = db.prepare('SELECT id, name, role FROM staff WHERE id = ?').get(operatorId) as any
  const now = new Date().toISOString()
  db.prepare(`
    UPDATE attendance SET status = 'pending_review', confirmedAt = ?, currentResponsible = ?, updatedAt = ?
    WHERE id = ?
  `).run(now, getFloorSupervisorId(), now, id)

  logOperation({
    operatorId,
    operatorName: operator?.name || '',
    operatorRole: operator?.role || '',
    action: 'confirm_attendance',
    entityType: 'attendance',
    entityId: id,
    fromStatus: 'pending_confirm',
    toStatus: 'pending_review',
    detail: '导购确认考勤'
  })

  return db.prepare('SELECT * FROM attendance WHERE id = ?').get(id)
}

export function markException(id: number, operatorId: number, exceptionType: string, note: string) {
  const att = db.prepare('SELECT * FROM attendance WHERE id = ?').get(id) as any
  if (!att) throw new Error('考勤记录不存在')

  const operator = db.prepare('SELECT id, name, role FROM staff WHERE id = ?').get(operatorId) as any
  const fromStatus = att.status
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

  logOperation({
    operatorId,
    operatorName: operator?.name || '',
    operatorRole: operator?.role || '',
    action: 'mark_exception',
    entityType: 'attendance',
    entityId: id,
    fromStatus,
    toStatus: newStatus,
    detail: `标记异常: ${exceptionType} - ${note}`
  })

  return db.prepare('SELECT * FROM attendance WHERE id = ?').get(id)
}

export function submitMaterial(id: number, operatorId: number) {
  const att = db.prepare('SELECT * FROM attendance WHERE id = ?').get(id) as any
  if (!att) throw new Error('考勤记录不存在')
  if (att.status !== 'pending_material') throw new Error('当前状态不允许提交材料')

  const operator = db.prepare('SELECT id, name, role FROM staff WHERE id = ?').get(operatorId) as any
  const now = new Date().toISOString()
  db.prepare(`
    UPDATE attendance SET status = 'pending_review', exceptionType = 'material_submitted', currentResponsible = ?, updatedAt = ?
    WHERE id = ?
  `).run(getFloorSupervisorId(), now, id)

  logOperation({
    operatorId,
    operatorName: operator?.name || '',
    operatorRole: operator?.role || '',
    action: 'submit_material',
    entityType: 'attendance',
    entityId: id,
    fromStatus: 'pending_material',
    toStatus: 'pending_review',
    detail: '提交材料，转为待复核'
  })

  return db.prepare('SELECT * FROM attendance WHERE id = ?').get(id)
}

export function escalateTimeout(id: number, supervisorId: number) {
  const att = db.prepare('SELECT * FROM attendance WHERE id = ?').get(id) as any
  if (!att) throw new Error('考勤记录不存在')
  if (att.status !== 'timeout_escalated' && att.status !== 'pending_confirm') throw new Error('当前状态不允许此操作')

  const operator = db.prepare('SELECT id, name, role FROM staff WHERE id = ?').get(supervisorId) as any
  const now = new Date().toISOString()
  const fromStatus = att.status

  if (att.status === 'pending_confirm') {
    db.prepare(`
      UPDATE attendance SET status = 'timeout_escalated', currentResponsible = ?, updatedAt = ?
      WHERE id = ?
    `).run(supervisorId, now, id)

    logOperation({
      operatorId: supervisorId,
      operatorName: operator?.name || '',
      operatorRole: operator?.role || '',
      action: 'escalate_timeout',
      entityType: 'attendance',
      entityId: id,
      fromStatus,
      toStatus: 'timeout_escalated',
      detail: '确认超时，升级至楼层主管'
    })
  } else {
    db.prepare(`
      UPDATE attendance SET status = 'pending_review', confirmedAt = ?, currentResponsible = ?, updatedAt = ?
      WHERE id = ?
    `).run(now, supervisorId, now, id)

    logOperation({
      operatorId: supervisorId,
      operatorName: operator?.name || '',
      operatorRole: operator?.role || '',
      action: 'confirm_on_behalf',
      entityType: 'attendance',
      entityId: id,
      fromStatus,
      toStatus: 'pending_review',
      detail: '楼层主管代确认，转为待复核'
    })
  }

  return db.prepare('SELECT * FROM attendance WHERE id = ?').get(id)
}

export function resubmitAfterReject(id: number, operatorId: number) {
  const att = db.prepare('SELECT * FROM attendance WHERE id = ?').get(id) as any
  if (!att) throw new Error('考勤记录不存在')
  if (att.status !== 'review_rejected') throw new Error('当前状态不允许重提')

  const operator = db.prepare('SELECT id, name, role, counterId FROM staff WHERE id = ?').get(operatorId) as any
  if (!operator) throw new Error('操作员不存在')
  if (operator.role !== 'counter_manager' || operator.counterId !== att.counterId) {
    throw new Error('只有对应专柜的柜长才能重提考勤')
  }

  const now = new Date().toISOString()
  db.prepare(`
    UPDATE attendance SET status = 'pending_review', currentResponsible = ?, rejectedReason = ?, updatedAt = ?
    WHERE id = ?
  `).run(getFloorSupervisorId(), null, now, id)

  logOperation({
    operatorId,
    operatorName: operator.name,
    operatorRole: operator.role,
    action: 'resubmit_attendance',
    entityType: 'attendance',
    entityId: id,
    fromStatus: 'review_rejected',
    toStatus: 'pending_review',
    detail: '柜长修正后重新提交复核'
  })

  return db.prepare('SELECT * FROM attendance WHERE id = ?').get(id)
}

function getFloorSupervisorId(): number {
  const row = db.prepare("SELECT id FROM staff WHERE role = 'floor_supervisor' LIMIT 1").get() as any
  return row?.id || 2
}
