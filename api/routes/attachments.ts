import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import db from '../db.js'

const router = Router()

router.get('/container/:containerId', (req: Request, res: Response): void => {
  try {
    const rows = db.prepare('SELECT id, container_id, file_name, file_size, mime_type, uploaded_by, created_at FROM attachments WHERE container_id = ? ORDER BY created_at DESC').all(req.params.containerId)
    res.json({ success: true, data: rows })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.post('/container/:containerId', (req: Request, res: Response): void => {
  try {
    const { file_name, file_size, mime_type, base64_data, uploaded_by } = req.body
    const id = uuidv4()
    db.prepare(`
      INSERT INTO attachments (id, container_id, file_name, file_size, mime_type, base64_data, uploaded_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, req.params.containerId, file_name, file_size, mime_type, base64_data, uploaded_by)
    const row = db.prepare('SELECT id, container_id, file_name, file_size, mime_type, uploaded_by, created_at FROM attachments WHERE id = ?').get(id)
    res.status(201).json({ success: true, data: row })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

export default router
