import { Router, type Request, type Response } from 'express'
import { getDb } from '../db/init.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

router.use(authMiddleware)

router.get('/appointment/:appointmentId', async (req: Request, res: Response): Promise<void> => {
  const db = getDb()
  const { appointmentId } = req.params
  const records = db.prepare('SELECT * FROM visit_records WHERE appointment_id = ? ORDER BY created_at DESC').all(appointmentId)
  res.json({ success: true, data: records })
})

router.post('/', async (req: Request, res: Response): Promise<void> => {
  const db = getDb()
  const user = (req as any).user
  const { appointmentId, visitDate, content, satisfaction, hasComplaint } = req.body

  if (!appointmentId || !content || !visitDate) {
    res.status(400).json({ success: false, error: '请填写完整信息' })
    return
  }

  const dbUser = db.prepare('SELECT * FROM users WHERE id = ?').get(user.userId) as any
  const id = `v_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
  const now = new Date().toISOString()

  db.prepare('INSERT INTO visit_records (id, appointment_id, visit_date, content, satisfaction, has_complaint, visitor_id, visitor_name, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
    id, appointmentId, visitDate, content, satisfaction || 0, hasComplaint ? 1 : 0, user.userId, dbUser.name, now
  )

  const record = db.prepare('SELECT * FROM visit_records WHERE id = ?').get(id)
  res.json({ success: true, data: record })
})

export default router
