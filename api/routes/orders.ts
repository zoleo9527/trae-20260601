import { Router, type Request, type Response } from 'express'
import { getDb } from '../db.js'

const router = Router()

router.get('/patient/:patientId', (req: Request, res: Response) => {
  const db = getDb()
  const orders = db.prepare(
    'SELECT * FROM orders WHERE patient_id = ? ORDER BY prescribed_at DESC'
  ).all(req.params.patientId)
  res.json({ success: true, data: orders })
})

router.post('/patient/:patientId', (req: Request, res: Response) => {
  const db = getDb()
  const { type, content, frequency, prescribedBy } = req.body
  const now = new Date().toISOString().slice(0, 16).replace('T', ' ')
  const result = db.prepare(`
    INSERT INTO orders (patient_id, type, content, frequency, prescribed_by, prescribed_at, is_active)
    VALUES (?, ?, ?, ?, ?, ?, 1)
  `).run(req.params.patientId, type, content, frequency, prescribedBy, now)
  res.json({ success: true, data: { id: result.lastInsertRowid } })
})

router.put('/:id/status', (req: Request, res: Response) => {
  const db = getDb()
  const { isActive } = req.body
  db.prepare('UPDATE orders SET is_active = ? WHERE id = ?').run(isActive ? 1 : 0, req.params.id)
  res.json({ success: true })
})

export default router
