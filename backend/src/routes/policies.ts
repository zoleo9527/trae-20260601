import { Router, Response } from 'express'
import db from '../database.js'
import { authMiddleware, AuthRequest } from '../middlewares/auth.js'

const router = Router()

router.get('/', authMiddleware, (req: AuthRequest, res: Response) => {
  const { status } = req.query

  let whereClause = '1=1'
  const params: any[] = []

  if (status) {
    whereClause += ' AND status = ?'
    params.push(status)
  }

  const items = db.prepare(`
    SELECT * FROM policies
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

  const policy = db.prepare('SELECT * FROM policies WHERE id = ?').get(id)

  if (!policy) {
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
    data: policy,
  })
})

export default router
