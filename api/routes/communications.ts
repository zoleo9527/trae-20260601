import { Router, type Request, type Response } from 'express'
import { getDb } from '../db.js'

const router = Router()

router.get('/patient/:patientId', (req: Request, res: Response) => {
  const db = getDb()
  const comms = db.prepare(
    'SELECT * FROM communications WHERE patient_id = ? ORDER BY contact_at DESC'
  ).all(req.params.patientId)
  res.json({ success: true, data: comms })
})

router.post('/patient/:patientId', (req: Request, res: Response) => {
  const db = getDb()
  const { contactAt, method, content, contactedBy, result } = req.body
  const r = db.prepare(`
    INSERT INTO communications (patient_id, contact_at, method, content, contacted_by, result)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(req.params.patientId, contactAt, method, content, contactedBy, result)
  res.json({ success: true, data: { id: r.lastInsertRowid } })
})

export default router
