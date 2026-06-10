import { Router, type Request, type Response } from 'express'
import pool from '../db.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

router.use(authMiddleware)

router.get('/', async (req: Request, res: Response): Promise<void> => {
  const { role } = req.query

  try {
    let sql = 'SELECT id, username, name, role, created_at FROM users WHERE 1=1'
    const params: unknown[] = []

    if (role) {
      params.push(role)
      sql += ` AND role = $${params.length}`
    }

    sql += ' ORDER BY id'

    const result = await pool.query(sql, params)
    res.json({ success: true, data: result.rows })
  } catch (err) {
    console.error('Get users error:', err)
    res.status(500).json({ success: false, error: '服务器内部错误' })
  }
})

export default router
