import { Router, type Request, type Response } from 'express'
import { getDb } from '../db/init.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

router.use(authMiddleware)

router.get('/appointment/:appointmentId', async (req: Request, res: Response): Promise<void> => {
  const db = getDb()
  const { appointmentId } = req.params
  const notes = db.prepare('SELECT * FROM consultation_notes WHERE appointment_id = ? ORDER BY created_at DESC').all(appointmentId)
  res.json({ success: true, data: notes })
})

router.post('/', async (req: Request, res: Response): Promise<void> => {
  const db = getDb()
  const user = (req as any).user
  const { appointmentId, content } = req.body

  if (!appointmentId || !content) {
    res.status(400).json({ success: false, error: '请填写完整信息' })
    return
  }

  const dbUser = db.prepare('SELECT * FROM users WHERE id = ?').get(user.userId) as any
  const id = `n_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
  const now = new Date().toISOString()

  db.prepare('INSERT INTO consultation_notes (id, appointment_id, content, author_id, author_name, author_role, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
    id, appointmentId, content, user.userId, dbUser.name, dbUser.role, now
  )

  const note = db.prepare('SELECT * FROM consultation_notes WHERE id = ?').get(id)
  res.json({ success: true, data: note })
})

export default router
