import { Response, Router } from 'express'
import db from '../database.js'
import { authMiddleware, AuthRequest } from '../middlewares/auth.js'

const router = Router()

router.get('/todos', authMiddleware, (req: AuthRequest, res: Response) => {
  const user = req.user!

  const reviewPending = db.prepare(`
    SELECT
      c.id as coupon_id,
      c.coupon_code,
      m.name as member_name,
      c.issue_date,
      c.updated_at,
      u.name as operator_name,
      ROUND((julianday('now') - julianday(c.updated_at)) * 24) as hours_waiting
    FROM coupons c
    LEFT JOIN members m ON c.member_id = m.id
    LEFT JOIN users u ON c.operator_id = u.id
    WHERE c.status = 'pending_review'
    ${user.role === 'clerk' ? 'AND c.store_id = ?' : user.role === 'manager' ? 'AND c.store_id = ?' : ''}
    ORDER BY c.updated_at ASC
    LIMIT 5
  `).all(...(user.role !== 'buyer' ? [user.store_id] : [])) as any[]

  const draftPending = db.prepare(`
    SELECT
      c.id as coupon_id,
      c.coupon_code,
      m.name as member_name,
      c.issue_date,
      c.updated_at,
      u.name as operator_name
    FROM coupons c
    LEFT JOIN members m ON c.member_id = m.id
    LEFT JOIN users u ON c.operator_id = u.id
    WHERE c.status = 'draft'
    ${user.role === 'clerk' ? 'AND c.operator_id = ?' : user.role === 'manager' ? 'AND c.store_id = ?' : ''}
    ORDER BY c.updated_at ASC
    LIMIT 5
  `).all(...(user.role === 'clerk' ? [user.id] : user.role === 'manager' ? [user.store_id] : [])) as any[]

  const todos = []

  if (reviewPending.length > 0) {
    todos.push({
      type: 'review_pending',
      title: user.role === 'manager' ? '待您复核' : '等待复核',
      description: user.role === 'manager' ? '需要您进行复核审批' : '等待店长复核中',
      count: reviewPending.length,
      responsible_role: user.role === 'manager' ? '店长（您）' : '店长',
      items: reviewPending.map((item) => ({
        coupon_id: item.coupon_id,
        coupon_code: item.coupon_code,
        member_name: item.member_name,
        issue_date: item.issue_date,
        operator_name: item.operator_name,
        waiting_time: `${Math.round(item.hours_waiting || 0)}小时`,
      })),
    })
  }

  if (draftPending.length > 0) {
    todos.push({
      type: 'draft_pending',
      title: user.role === 'clerk' ? '我的草稿' : '门店草稿',
      description: user.role === 'clerk' ? '您创建的待提交草稿' : '店员创建的待提交草稿',
      count: draftPending.length,
      responsible_role: user.role === 'clerk' ? '店员（您）' : '店员',
      items: draftPending.map((item) => ({
        coupon_id: item.coupon_id,
        coupon_code: item.coupon_code,
        member_name: item.member_name,
        issue_date: item.issue_date,
        operator_name: item.operator_name,
      })),
    })
  }

  res.json({
    success: true,
    data: todos,
  })
})

router.get('/risks', authMiddleware, (req: AuthRequest, res: Response) => {
  const user = req.user!

  let whereClause = ''
  const params: any[] = []

  if (user.role === 'clerk') {
    whereClause = 'WHERE c.store_id = ?'
    params.push(user.store_id)
  }

  const expiredUnverified = db.prepare(`
    SELECT COUNT(*) as count
    FROM coupons c
    ${whereClause ? whereClause + ' AND' : 'WHERE'}
      c.status = 'issued'
      AND c.expiry_date < date('now')
  `).get(...params) as { count: number }

  const reviewOverdue = db.prepare(`
    SELECT COUNT(*) as count
    FROM coupons c
    ${whereClause ? whereClause + ' AND' : 'WHERE'}
      c.status = 'pending_review'
      AND julianday('now') - julianday(c.updated_at) > 2
  `).get(...params) as { count: number }

  const batchExpiring = db.prepare(`
    SELECT COUNT(*) as count
    FROM batches b
    WHERE b.status = 'expiring'
  `).get() as { count: number }

  const risks = []

  if (expiredUnverified.count > 0) {
    risks.push({
      type: 'expired_unverified',
      level: 'high',
      count: expiredUnverified.count,
      description: '已过期但未核销的券',
    })
  }

  if (reviewOverdue.count > 0) {
    risks.push({
      type: 'review_overdue',
      level: 'high',
      count: reviewOverdue.count,
      description: '复核超期（>48小时）',
    })
  }

  if (batchExpiring.count > 0) {
    risks.push({
      type: 'batch_expiring',
      level: 'medium',
      count: batchExpiring.count,
      description: '批号3天内到期',
    })
  }

  res.json({
    success: true,
    data: risks,
  })
})

router.get('/recent', authMiddleware, (req: AuthRequest, res: Response) => {
  const user = req.user!

  let whereClause = ''
  const params: any[] = []

  if (user.role === 'clerk') {
    whereClause = 'WHERE c.store_id = ?'
    params.push(user.store_id)
  }

  const recentLogs = db.prepare(`
    SELECT
      ol.coupon_id,
      c.coupon_code,
      ol.action,
      u.name as operator,
      ol.created_at as timestamp
    FROM operation_logs ol
    LEFT JOIN coupons c ON ol.coupon_id = c.id
    LEFT JOIN users u ON ol.user_id = u.id
    ${whereClause ? whereClause + ' AND' : 'WHERE'} 1=1
    ORDER BY ol.created_at DESC
    LIMIT 10
  `).all(...params)

  res.json({
    success: true,
    data: recentLogs,
  })
})

export default router
