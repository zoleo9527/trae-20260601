import db from '../db.js'
import { logOperation } from './logService.js'

interface ReviewFilters {
  status?: string
  reviewerId?: number
}

export function getReviews(filters: ReviewFilters = {}) {
  let sql = `
    SELECT a.id AS attendanceId, a.status, a.date, a.shift, a.rejectedReason,
           s.name AS staffName, c.name AS counterName,
               r.id AS reviewId, r.reviewerId, r.reviewerRole, r.action, r.reason, r.createdAt AS reviewCreatedAt
    FROM reviews r
    JOIN attendance a ON r.attendanceId = a.id
    LEFT JOIN staff s ON a.staffId = s.id
    LEFT JOIN counters c ON a.counterId = c.id
    WHERE 1=1
  `
  const params: unknown[] = []

  if (filters.status) {
    sql += ' AND a.status = ?'
    params.push(filters.status)
  }
  if (filters.reviewerId) {
    sql += ' AND r.reviewerId = ?'
    params.push(filters.reviewerId)
  }

  sql += ' ORDER BY r.createdAt DESC'

  return db.prepare(sql).all(...params)
}

export function approveReview(id: number, reviewerId: number, reviewerRole: string) {
  const att = db.prepare('SELECT * FROM attendance WHERE id = ?').get(id) as any
  if (!att) throw new Error('考勤记录不存在')
  if (att.status !== 'pending_review' && att.status !== 'pending_brand_confirm') {
    throw new Error('当前状态不允许审核通过')
  }

  const now = new Date().toISOString()
  let newStatus: string
  let nextResponsible: number | null = null

  if (reviewerRole === 'floor_supervisor') {
    if (att.status !== 'pending_review') throw new Error('楼层主管只能审核待复核记录')
    newStatus = 'pending_brand_confirm'
    const brandSup = db.prepare("SELECT id FROM staff WHERE role = 'brand_supervisor' LIMIT 1").get() as any
    nextResponsible = brandSup?.id || null
  } else if (reviewerRole === 'brand_supervisor') {
    if (att.status !== 'pending_brand_confirm') throw new Error('品牌督导只能审核待品牌确认记录')
    newStatus = 'closed'
    nextResponsible = null
  } else {
    throw new Error('无审核权限的角色')
  }

  db.prepare(`
    UPDATE attendance SET status = ?, currentResponsible = ?, updatedAt = ? WHERE id = ?
  `).run(newStatus, nextResponsible, now, id)

  db.prepare(`
    INSERT INTO reviews (attendanceId, reviewerId, reviewerRole, action, reason, createdAt)
    VALUES (?, ?, ?, 'approve', '', ?)
  `).run(id, reviewerId, reviewerRole, now)

  const reviewer = db.prepare('SELECT name FROM staff WHERE id = ?').get(reviewerId) as any
  logOperation({
    operatorId: reviewerId,
    operatorName: reviewer?.name || '',
    action: 'approve_review',
    entityType: 'attendance',
    entityId: id,
    detail: `${reviewerRole} 审核通过，状态变为 ${newStatus}`
  })

  return db.prepare('SELECT * FROM attendance WHERE id = ?').get(id)
}

export function rejectReview(id: number, reviewerId: number, reviewerRole: string, reason: string) {
  const att = db.prepare('SELECT * FROM attendance WHERE id = ?').get(id) as any
  if (!att) throw new Error('考勤记录不存在')
  if (att.status !== 'pending_review' && att.status !== 'pending_brand_confirm') {
    throw new Error('当前状态不允许驳回')
  }

  const now = new Date().toISOString()
  const counterManager = db.prepare(
    "SELECT id FROM staff WHERE role = 'counter_manager' AND counterId = ? LIMIT 1"
  ).get(att.counterId) as any

  db.prepare(`
    UPDATE attendance SET status = 'review_rejected', currentResponsible = ?, rejectedReason = ?, updatedAt = ?
    WHERE id = ?
  `).run(counterManager?.id || null, reason, now, id)

  db.prepare(`
    INSERT INTO reviews (attendanceId, reviewerId, reviewerRole, action, reason, createdAt)
    VALUES (?, ?, ?, 'reject', ?, ?)
  `).run(id, reviewerId, reviewerRole, reason, now)

  const reviewer = db.prepare('SELECT name FROM staff WHERE id = ?').get(reviewerId) as any
  logOperation({
    operatorId: reviewerId,
    operatorName: reviewer?.name || '',
    action: 'reject_review',
    entityType: 'attendance',
    entityId: id,
    detail: `${reviewerRole} 驳回审核: ${reason}`
  })

  return db.prepare('SELECT * FROM attendance WHERE id = ?').get(id)
}
