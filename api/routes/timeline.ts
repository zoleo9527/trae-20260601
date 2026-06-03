import { Router, type Request, type Response } from 'express'
import db from '../db/index.js'

const router = Router()

router.get('/:id/timeline', (req: Request, res: Response): void => {
  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id)
  if (!event) {
    res.status(404).json({ success: false, error: 'Event not found' })
    return
  }
  const entries = db.prepare('SELECT * FROM timeline_entries WHERE event_id = ? ORDER BY timestamp ASC').all(req.params.id)
  res.json({ success: true, data: entries })
})

export default router
