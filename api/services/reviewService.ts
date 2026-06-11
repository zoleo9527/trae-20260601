import db from '../db.js'
import { logOperation } from './logService.js'

interface ReviewFilters {
  status?: string
  reviewerId?: number
  counterId?: number
  brandId?: number
}

export function getReviews(filters: ReviewFilters = {}) {
  let sql = `
    SELECT a.id AS attendanceId, a.status, a.date, a.shift, a.rejectedReason, a.counterId,
           c.brand_id AS brandId, b.name AS brandName,
           s.name AS staffName, c.name AS counterName,
               r.id AS reviewId, r.reviewerId, r.reviewerRole, r.action, r.reason, r.createdAt AS reviewCreatedAt
    FROM reviews r
    JOIN attendance a ON r.attendanceId = a.id
    LEFT JOIN staff s ON a.staffId = s.id
    LEFT JOIN counters c ON a.counterId = c.id
    LEFT JOIN brands b ON c.brand_id = b.id
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
  if (filters.counterId) {
    sql += ' AND a.counterId = ?'
    params.push(filters.counterId)
  }
  if (filters.brandId) {
    sql += ' AND c.brand_id = ?'
    params.push(filters.brandId)
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
  const fromStatus = att.status

  const reviewer = db.prepare('SELECT id, name, role, brandId FROM staff WHERE id = ?').get(reviewerId) as any
  const now = new Date().toISOString()
  let newStatus: string
  let nextResponsible: number | null = null

  if (reviewerRole === 'floor_supervisor') {
    if (att.status !== 'pending_review') throw new Error('楼层主管只能审核待复核记录')
    newStatus = 'pending_brand_confirm'
    const counter = db.prepare('SELECT brand_id FROM counters WHERE id = ?').get(att.counterId) as any
    const brandSup = db.prepare("SELECT id FROM staff WHERE role = 'brand_supervisor' AND brandId = ? LIMIT 1").get(counter?.brand_id) as any
    if (!brandSup) {
      const fallback = db.prepare("SELECT id FROM staff WHERE role = 'brand_supervisor' LIMIT 1").get() as any
      nextResponsible = fallback?.id || null
    } else {
      nextResponsible = brandSup?.id || null
    }
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

  logOperation({
    operatorId: reviewerId,
    operatorName: reviewer?.name || '',
    operatorRole: reviewer?.role || reviewerRole,
    action: 'approve_review',
    entityType: 'attendance',
    entityId: id,
    fromStatus,
    toStatus: newStatus,
    detail: `${reviewerRole} 审核通过，状态 ${fromStatus} → ${newStatus}`
  })

  return db.prepare('SELECT * FROM attendance WHERE id = ?').get(id)
}

export function rejectReview(id: number, reviewerId: number, reviewerRole: string, reason: string) {
  const att = db.prepare('SELECT * FROM attendance WHERE id = ?').get(id) as any
  if (!att) throw new Error('考勤记录不存在')
  if (att.status !== 'pending_review' && att.status !== 'pending_brand_confirm') {
    throw new Error('当前状态不允许驳回')
  }
  const fromStatus = att.status

  const now = new Date().toISOString()
  const counterManager = db.prepare(
    "SELECT id FROM staff WHERE role = 'counter_manager' AND counterId = ? LIMIT 1"
  ).get(att.counterId) as any
  const reviewer = db.prepare('SELECT id, name, role FROM staff WHERE id = ?').get(reviewerId) as any

  db.prepare(`
    UPDATE attendance SET status = 'review_rejected', currentResponsible = ?, rejectedReason = ?, updatedAt = ?
    WHERE id = ?
  `).run(counterManager?.id || null, reason, now, id)

  db.prepare(`
    INSERT INTO reviews (attendanceId, reviewerId, reviewerRole, action, reason, createdAt)
    VALUES (?, ?, ?, 'reject', ?, ?)
  `).run(id, reviewerId, reviewerRole, reason, now)

  logOperation({
    operatorId: reviewerId,
    operatorName: reviewer?.name || '',
    operatorRole: reviewer?.role || reviewerRole,
    action: 'reject_review',
    entityType: 'attendance',
    entityId: id,
    fromStatus,
    toStatus: 'review_rejected',
    detail: `${reviewerRole} 驳回审核: ${reason}`
  })

  return db.prepare('SELECT * FROM attendance WHERE id = ?').get(id)
}
