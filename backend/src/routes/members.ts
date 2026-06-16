import { Router, Response } from 'express'
import db from '../database.js'
import { authMiddleware, AuthRequest } from '../middlewares/auth.js'

const router = Router()

router.get('/', authMiddleware, (req: AuthRequest, res: Response) => {
  const { search, limit = 100 } = req.query

  let whereClause = '1=1'
  const params: any[] = []

  if (search) {
    whereClause += ' AND (name LIKE ? OR phone LIKE ? OR baby_name LIKE ?)'
    params.push(`%${search}%`, `%${search}%`, `%${search}%`)
  }

  const items = db.prepare(`
    SELECT * FROM members
    WHERE ${whereClause}
    ORDER BY created_at DESC
    LIMIT ?
  `).all(...params, Number(limit))

  res.json({
    success: true,
    data: items,
  })
})

router.get('/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  const { id } = req.params

  const member = db.prepare('SELECT * FROM members WHERE id = ?').get(id)

  if (!member) {
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
    data: member,
  })
})

router.get('/:id/coupons', authMiddleware, (req: AuthRequest, res: Response) => {
  const { id } = req.params

  const coupons = db.prepare(`
    SELECT
      c.*,
      p.name as policy_name,
      s.name as store_name
    FROM coupons c
    LEFT JOIN policies p ON c.policy_id = p.id
    LEFT JOIN stores s ON c.store_id = s.id
    WHERE c.member_id = ?
    ORDER BY c.created_at DESC
  `).all(id)

  res.json({
    success: true,
    data: coupons,
  })
})

export default router
