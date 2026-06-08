import { Router, type Request, type Response } from 'express'
import db from '../db.js'
import { authMiddleware } from '../middleware/auth.js'
import { roleMiddleware } from '../middleware/role.js'

const router = Router()

router.use(authMiddleware, roleMiddleware(['supervisor']))

router.get('/', (req: Request, res: Response): void => {
  const { operator_id, action_type, from, to } = req.query

  let sql = `
    SELECT al.*, u.name as operator_name
    FROM audit_logs al
    LEFT JOIN users u ON al.operator_id = u.id
    WHERE 1=1
  `
  const params: any[] = []

  if (operator_id) {
    sql += ' AND al.operator_id = ?'
    params.push(Number(operator_id))
  }
  if (action_type) {
    sql += ' AND al.action_type = ?'
    params.push(action_type)
  }
  if (from) {
    sql += ' AND al.created_at >= ?'
    params.push(from)
  }
  if (to) {
    sql += ' AND al.created_at <= ?'
    params.push(to)
  }

  sql += ' ORDER BY al.created_at DESC LIMIT 200'

  const logs = db.prepare(sql).all(...params)
  res.json({ success: true, data: logs })
})

export default router
