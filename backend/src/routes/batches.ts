import { Router, Response } from 'express'
import db from '../database.js'
import { authMiddleware, AuthRequest } from '../middlewares/auth.js'

const router = Router()

router.get('/', authMiddleware, (req: AuthRequest, res: Response) => {
  const { search, status, page = 1, limit = 100 } = req.query
  const offset = (Number(page) - 1) * Number(limit)

  let whereClause = '1=1'
  const params: any[] = []

  if (search) {
    whereClause += ' AND (batch_number LIKE ? OR supplier LIKE ?)'
    params.push(`%${search}%`, `%${search}%`)
  }

  if (status) {
    const statusList = (status as string).split(',')
    whereClause += ` AND status IN (${statusList.map(() => '?').join(',')})`
    params.push(...statusList)
  }

  const countQuery = `SELECT COUNT(*) as total FROM batches WHERE ${whereClause}`
  const total = (db.prepare(countQuery).get(...params) as { total: number }).total

  const items = db.prepare(`
    SELECT * FROM batches
    WHERE ${whereClause}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, Number(limit), offset)

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

router.get('/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  const { id } = req.params

  const batch = db.prepare('SELECT * FROM batches WHERE id = ?').get(id)

  if (!batch) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'BUSINESS_002',
        message: '数据不存在',
      },
    })
  }

  res.json({
    success: true,
    data: batch,
  })
})

router.get('/:id/coupons', authMiddleware, (req: AuthRequest, res: Response) => {
  const { id } = req.params

  const coupons = db.prepare(`
    SELECT
      c.*,
      p.id as policy_id, p.name as policy_name, p.discount_amount,
      m.id as member_id, m.name as member_name, m.phone as member_phone,
      s.id as store_id, s.name as store_name
    FROM coupons c
    LEFT JOIN policies p ON c.policy_id = p.id
    LEFT JOIN members m ON c.member_id = m.id
    LEFT JOIN stores s ON c.store_id = s.id
    WHERE c.batch_id = ?
    ORDER BY c.created_at DESC
  `).all(id) as any[]

  const formattedCoupons = coupons.map(coupon => ({
    ...coupon,
    policy: coupon.policy_id ? {
      id: coupon.policy_id,
      name: coupon.policy_name,
      discount_amount: coupon.discount_amount,
    } : null,
    member: coupon.member_id ? {
      id: coupon.member_id,
      name: coupon.member_name,
      phone: coupon.member_phone,
    } : null,
    store: coupon.store_id ? {
      id: coupon.store_id,
      name: coupon.store_name,
    } : null,
  }))

  res.json({
    success: true,
    data: formattedCoupons,
  })
})

export default router
