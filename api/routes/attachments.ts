import { Router, type Request, type Response } from 'express'
import db, { genId } from '../database.js'

const router = Router()

router.get('/:registrationId', (req: Request, res: Response) => {
  const registration = db.prepare('SELECT * FROM registrations WHERE id = ?').get(req.params.registrationId)
  if (!registration) {
    res.status(404).json({ success: false, error: 'Registration not found' })
    return
  }

  const attachments = db.prepare('SELECT * FROM attachments WHERE registration_id = ? ORDER BY file_name ASC').all(req.params.registrationId)
  res.json({ success: true, data: attachments })
})

router.post('/', (req: Request, res: Response) => {
  const { registration_id, file_name, file_size } = req.body
  if (!registration_id || !file_name) {
    res.status(400).json({ success: false, error: 'registration_id and file_name are required' })
    return
  }

  const registration = db.prepare('SELECT * FROM registrations WHERE id = ?').get(registration_id)
  if (!registration) {
    res.status(404).json({ success: false, error: 'Registration not found' })
    return
  }

  const id = genId('att')
  db.prepare(`
    INSERT INTO attachments (id, registration_id, file_name, file_size, status, uploaded_at, uploaded_by)
    VALUES (?, ?, ?, ?, 'placeholder', NULL, NULL)
  `).run(id, registration_id, file_name, file_size || '0')

  const attachment = db.prepare('SELECT * FROM attachments WHERE id = ?').get(id)
  res.status(201).json({ success: true, data: attachment })
})

router.patch('/:id', (req: Request, res: Response) => {
  const { status, uploaded_by } = req.body
  if (!status) {
    res.status(400).json({ success: false, error: 'status is required' })
    return
  }

  const attachment = db.prepare('SELECT * FROM attachments WHERE id = ?').get(req.params.id)
  if (!attachment) {
    res.status(404).json({ success: false, error: 'Attachment not found' })
    return
  }

  const nowISO = new Date().toISOString()
  const uploadedAt = status === 'uploaded' ? nowISO : null
  const uploader = status === 'uploaded' ? (uploaded_by || null) : null
  db.prepare('UPDATE attachments SET status = ?, uploaded_at = COALESCE(?, uploaded_at), uploaded_by = COALESCE(?, uploaded_by) WHERE id = ?').run(status, uploadedAt, uploader, req.params.id)

  const updated = db.prepare('SELECT * FROM attachments WHERE id = ?').get(req.params.id)
  res.json({ success: true, data: updated })
})

export default router
