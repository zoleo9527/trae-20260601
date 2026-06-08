import { Router, type Request, type Response } from 'express'
import db, { genId } from '../database.js'

const router = Router()

router.get('/:registrationId', (req: Request, res: Response) => {
  const registration = db.prepare('SELECT * FROM registrations WHERE id = ?').get(req.params.registrationId)
  if (!registration) {
    res.status(404).json({ success: false, error: 'Registration not found' })
    return
  }

  const logs = db.prepare('SELECT * FROM handover_logs WHERE registration_id = ? ORDER BY created_at ASC').all(req.params.registrationId)
  res.json({ success: true, data: logs })
})

router.get('/recent/all', (_req: Request, res: Response) => {
  const logs = db.prepare(`
    SELECT hl.*, r.event_name
    FROM handover_logs hl
    LEFT JOIN registrations r ON r.id = hl.registration_id
    ORDER BY hl.created_at DESC
    LIMIT 15
  `).all()
  res.json({ success: true, data: logs })
})

router.post('/', (req: Request, res: Response) => {
  const { registration_id, operator_role, operator_name, action, note_type, note, from_role, to_role } = req.body
  if (!registration_id || !operator_role || !operator_name || !action) {
    res.status(400).json({ success: false, error: 'registration_id, operator_role, operator_name, and action are required' })
    return
  }

  const registration = db.prepare('SELECT * FROM registrations WHERE id = ?').get(registration_id)
  if (!registration) {
    res.status(404).json({ success: false, error: 'Registration not found' })
    return
  }

  const nowISO = new Date().toISOString()
  const id = `log-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
  db.prepare(`
    INSERT INTO handover_logs (id, registration_id, operator_role, operator_name, action, note_type, note, created_at, from_role, to_role)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, registration_id, operator_role, operator_name, action, note_type || 'normal', note || '', nowISO, from_role || null, to_role || null)

  const log = db.prepare('SELECT * FROM handover_logs WHERE id = ?').get(id)
  res.status(201).json({ success: true, data: log })
})

export default router
