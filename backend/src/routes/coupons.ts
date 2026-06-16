import { Router, Response } from 'express'
import db from '../database.js'
import { authMiddleware, AuthRequest } from '../middlewares/auth.js'

const router = Router()

router.get('/', authMiddleware, (req: AuthRequest, res: Response) => {
  const { status, member_id, search, page = 1, limit = 20 } = req.query
  const offset = (Number(page) - 1) * Number(limit)

  let whereClause = '1=1'
  const params: any[] = []

  if (req.user!.role === 'clerk') {
    whereClause += ' AND c.store_id = ?'
    params.push(req.user!.store_id)
  } else if (req.user!.role === 'buyer') {
    whereClause += ' AND c.status IN (?, ?)'
    params.push('issued', 'verified')
  }

  if (status) {
    whereClause += ' AND c.status = ?'
    params.push(status)
  }

  if (member_id) {
    whereClause += ' AND c.member_id = ?'
    params.push(member_id)
  }

  if (search) {
    whereClause += ' AND (c.coupon_code LIKE ? OR m.name LIKE ?)'
    params.push(`%${search}%`, `%${search}%`)
  }

  const countQuery = `
    SELECT COUNT(*) as total
    FROM coupons c
    LEFT JOIN members m ON c.member_id = m.id
    WHERE ${whereClause}
  `

  const total = (db.prepare(countQuery).get(...params) as { total: number }).total

  const query = `
    SELECT
      c.*,
      p.name as policy_name, p.discount_amount,
      m.name as member_name, m.phone as member_phone,
      s.name as store_name,
      u.name as operator_name
    FROM coupons c
    LEFT JOIN policies p ON c.policy_id = p.id
    LEFT JOIN members m ON c.member_id = m.id
    LEFT JOIN stores s ON c.store_id = s.id
    LEFT JOIN users u ON c.operator_id = u.id
    WHERE ${whereClause}
    ORDER BY c.created_at DESC
    LIMIT ? OFFSET ?
  `

  const items = db.prepare(query).all(...params, Number(limit), offset)

  res.json({
    success: true,
    data: {
      items,
      total,
      page: Number(page),
      limit: Number(limit),
    },
  })
})

router.post('/', authMiddleware, (req: AuthRequest, res: Response) => {
  if (req.user!.role === 'buyer') {
    return res.status(403).json({
      success: false,
      error: {
        code: 'AUTH_001',
        message: '采购角色无权创建促销券',
      },
    })
  }

  const { policy_id, member_id, batch_id, expiry_date, issue_remarks } = req.body

  if (!policy_id || !member_id || !expiry_date) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_002',
        message: '必填项不能为空',
      },
    })
  }

  const couponCode = `COUP${new Date().toISOString().slice(0, 10).replace(/-/g, '')}${String(Date.now()).slice(-6)}`

  const result = db.prepare(`
    INSERT INTO coupons (coupon_code, policy_id, member_id, store_id, operator_id, expiry_date, batch_id, issue_remarks, issue_date, current_handler_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    couponCode,
    policy_id,
    member_id,
    req.user!.store_id,
    req.user!.id,
    expiry_date,
    batch_id || null,
    issue_remarks || null,
    new Date().toISOString().slice(0, 10),
    req.user!.id
  )

  db.prepare(`
    INSERT INTO operation_logs (coupon_id, user_id, action, new_value)
    VALUES (?, ?, ?, ?)
  `).run(result.lastInsertRowid, req.user!.id, 'created', issue_remarks || null)

  const coupon = db.prepare('SELECT * FROM coupons WHERE id = ?').get(result.lastInsertRowid)

  res.json({
    success: true,
    data: coupon,
  })
})

router.get('/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  const { id } = req.params

  const coupon = db.prepare(`
    SELECT
      c.*,
      p.name as policy_name, p.discount_amount, p.description as policy_description,
      m.name as member_name, m.phone as member_phone, m.baby_name, m.tier, m.points,
      s.name as store_name,
      u.name as operator_name,
      b.batch_number, b.supplier, b.production_date as batch_production_date, b.expiry_date as batch_expiry_date, b.status as batch_status
    FROM coupons c
    LEFT JOIN policies p ON c.policy_id = p.id
    LEFT JOIN members m ON c.member_id = m.id
    LEFT JOIN stores s ON c.store_id = s.id
    LEFT JOIN users u ON c.operator_id = u.id
    LEFT JOIN batches b ON c.batch_id = b.id
    WHERE c.id = ?
  `).get(id) as any

  if (!coupon) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'BUSINESS_002',
        message: '数据不存在',
      },
    })
  }

  const attachments = db.prepare('SELECT * FROM attachments WHERE coupon_id = ?').all(id)

  const history = db.prepare(`
    SELECT ol.*, u.name as user_name
    FROM operation_logs ol
    LEFT JOIN users u ON ol.user_id = u.id
    WHERE ol.coupon_id = ?
    ORDER BY ol.created_at ASC
  `).all(id)

  const formattedCoupon = {
    id: coupon.id,
    coupon_code: coupon.coupon_code,
    policy_id: coupon.policy_id,
    policy: {
      id: coupon.policy_id,
      name: coupon.policy_name,
      description: coupon.policy_description,
      discount_amount: coupon.discount_amount,
    },
    member_id: coupon.member_id,
    member: {
      id: coupon.member_id,
      name: coupon.member_name,
      phone: coupon.member_phone,
      baby_name: coupon.baby_name,
      tier: coupon.tier,
      points: coupon.points,
    },
    store_id: coupon.store_id,
    store: {
      id: coupon.store_id,
      name: coupon.store_name,
    },
    operator_id: coupon.operator_id,
    operator: {
      id: coupon.operator_id,
      name: coupon.operator_name,
    },
    status: coupon.status,
    issue_date: coupon.issue_date,
    expiry_date: coupon.expiry_date,
    batch_id: coupon.batch_id,
    batch: coupon.batch_id ? {
      id: coupon.batch_id,
      batch_number: coupon.batch_number,
      supplier: coupon.supplier,
      production_date: coupon.batch_production_date,
      expiry_date: coupon.batch_expiry_date,
      status: coupon.batch_status,
    } : null,
    issue_remarks: coupon.issue_remarks,
    review_remarks: coupon.review_remarks,
    attachments,
    history: history.map((h: any) => ({
      id: h.id,
      coupon_id: h.coupon_id,
      user_id: h.user_id,
      user: {
        id: h.user_id,
        name: h.user_name,
      },
      action: h.action,
      old_value: h.old_value,
      new_value: h.new_value,
      created_at: h.created_at,
    })),
    created_at: coupon.created_at,
    updated_at: coupon.updated_at,
  }

  res.json({
    success: true,
    data: formattedCoupon,
  })
})

router.put('/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  if (req.user!.role === 'buyer') {
    return res.status(403).json({
      success: false,
      error: {
        code: 'AUTH_001',
        message: '采购角色无权修改促销券',
      },
    })
  }

  const { id } = req.params
  const { policy_id, batch_id, expiry_date, issue_remarks } = req.body

  const coupon = db.prepare('SELECT * FROM coupons WHERE id = ?').get(id) as any

  if (!coupon) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'BUSINESS_002',
        message: '数据不存在',
      },
    })
  }

  if (coupon.status !== 'draft' && coupon.status !== 'rejected') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'BUSINESS_001',
        message: '状态不允许修改',
      },
    })
  }

  db.prepare(`
    UPDATE coupons
    SET policy_id = COALESCE(?, policy_id),
        batch_id = COALESCE(?, batch_id),
        expiry_date = COALESCE(?, expiry_date),
        issue_remarks = COALESCE(?, issue_remarks),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(policy_id, batch_id, expiry_date, issue_remarks, id)

  db.prepare(`
    INSERT INTO operation_logs (coupon_id, user_id, action, old_value, new_value)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, req.user!.id, 'updated', coupon.issue_remarks, issue_remarks)

  const updatedCoupon = db.prepare('SELECT * FROM coupons WHERE id = ?').get(id)

  res.json({
    success: true,
    data: updatedCoupon,
  })
})

router.post('/:id/submit', authMiddleware, (req: AuthRequest, res: Response) => {
  if (req.user!.role === 'buyer') {
    return res.status(403).json({
      success: false,
      error: {
        code: 'AUTH_001',
        message: '采购角色无权提交促销券',
      },
    })
  }

  const { id } = req.params

  const coupon = db.prepare('SELECT * FROM coupons WHERE id = ?').get(id) as any

  if (!coupon) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'BUSINESS_002',
        message: '数据不存在',
      },
    })
  }

  if (coupon.status !== 'draft' && coupon.status !== 'rejected') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'BUSINESS_001',
        message: '状态不允许提交',
      },
    })
  }

  const newStatus = 'pending_review'

  const manager = db.prepare(`
    SELECT id FROM users WHERE role = 'manager' AND store_id = ?
    LIMIT 1
  `).get(coupon.store_id) as { id: number } | undefined

  db.prepare(`
    UPDATE coupons
    SET status = ?, updated_at = CURRENT_TIMESTAMP, current_handler_id = ?
    WHERE id = ?
  `).run(newStatus, manager?.id || coupon.operator_id, id)

  db.prepare(`
    INSERT INTO operation_logs (coupon_id, user_id, action)
    VALUES (?, ?, ?)
  `).run(id, req.user!.id, 'submitted_for_review')

  const updatedCoupon = db.prepare('SELECT * FROM coupons WHERE id = ?').get(id)

  res.json({
    success: true,
    data: updatedCoupon,
  })
})

router.post('/:id/review', authMiddleware, (req: AuthRequest, res: Response) => {
  const { id } = req.params
  const { action, remarks } = req.body

  if (req.user!.role !== 'manager') {
    return res.status(403).json({
      success: false,
      error: {
        code: 'AUTH_003',
        message: '只有店长可以复核',
      },
    })
  }

  const coupon = db.prepare('SELECT * FROM coupons WHERE id = ?').get(id) as any

  if (!coupon) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'BUSINESS_002',
        message: '数据不存在',
      },
    })
  }

  if (coupon.status !== 'pending_review') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'BUSINESS_001',
        message: '状态不允许复核',
      },
    })
  }

  if (action === 'reject' && !remarks) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_002',
        message: '拒绝时必须填写原因',
      },
    })
  }

  const newStatus = action === 'approve' ? 'issued' : 'rejected'
  const nextHandlerId = action === 'approve' ? coupon.operator_id : coupon.operator_id

  db.prepare(`
    UPDATE coupons
    SET status = ?, review_remarks = ?, updated_at = CURRENT_TIMESTAMP, current_handler_id = ?
    WHERE id = ?
  `).run(newStatus, remarks || null, nextHandlerId, id)

  db.prepare(`
    INSERT INTO operation_logs (coupon_id, user_id, action, new_value)
    VALUES (?, ?, ?, ?)
  `).run(id, req.user!.id, action === 'approve' ? 'approved' : 'rejected', remarks || null)

  const updatedCoupon = db.prepare('SELECT * FROM coupons WHERE id = ?').get(id)

  res.json({
    success: true,
    data: updatedCoupon,
  })
})

router.post('/:id/verify', authMiddleware, (req: AuthRequest, res: Response) => {
  const { id } = req.params

  if (req.user!.role !== 'manager') {
    return res.status(403).json({
      success: false,
      error: {
        code: 'AUTH_003',
        message: '只有店长可以核销',
      },
    })
  }

  const coupon = db.prepare('SELECT * FROM coupons WHERE id = ?').get(id) as any

  if (!coupon) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'BUSINESS_002',
        message: '数据不存在',
      },
    })
  }

  if (coupon.status !== 'issued') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'BUSINESS_001',
        message: '状态不允许核销',
      },
    })
  }

  db.prepare(`
    UPDATE coupons
    SET status = 'verified', updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(id)

  db.prepare(`
    INSERT INTO operation_logs (coupon_id, user_id, action)
    VALUES (?, ?, ?)
  `).run(id, req.user!.id, 'verified')

  const updatedCoupon = db.prepare('SELECT * FROM coupons WHERE id = ?').get(id)

  res.json({
    success: true,
    data: updatedCoupon,
  })
})

router.get('/:id/history', authMiddleware, (req: AuthRequest, res: Response) => {
  const { id } = req.params

  const history = db.prepare(`
    SELECT ol.*, u.name as user_name
    FROM operation_logs ol
    LEFT JOIN users u ON ol.user_id = u.id
    WHERE ol.coupon_id = ?
    ORDER BY ol.created_at ASC
  `).all(id)

  res.json({
    success: true,
    data: history,
  })
})

export default router
