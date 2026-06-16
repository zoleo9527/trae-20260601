import { Router, Response } from 'express'
import db from '../database.js'
import { authMiddleware, AuthRequest } from '../middlewares/auth.js'

const router = Router()

router.get('/', authMiddleware, (req: AuthRequest, res: Response) => {
  const { search, status } = req.query

  let whereClause = '1=1'
  const params: any[] = []

  if (search) {
    whereClause += ' AND (batch_number LIKE ? OR supplier LIKE ?)'
    params.push(`%${search}%`, `%${search}%`)
  }

  if (status) {
    whereClause += ' AND status = ?'
    params.push(status)
  }

  const items = db.prepare(`
    SELECT * FROM batches
    WHERE ${whereClause}
    ORDER BY created_at DESC
  `).all(...params)

  res.json({
    success: true,
    data: items,
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
      p.name as policy_name,
      m.name as member_name, m.phone as member_phone,
      s.name as store_name
    FROM coupons c
    LEFT JOIN policies p ON c.policy_id = p.id
    LEFT JOIN members m ON c.member_id = m.id
    LEFT JOIN stores s ON c.store_id = s.id
    WHERE c.batch_id = ?
    ORDER BY c.created_at DESC
  `).all(id)

  res.json({
    success: true,
    data: coupons,
  })
})

export default router
