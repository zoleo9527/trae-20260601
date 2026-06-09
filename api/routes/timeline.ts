import { Router, type Request, type Response } from 'express'
import db from '../db.js'

const router = Router()

router.get('/container/:containerId', (req: Request, res: Response): void => {
  try {
    const rows = db.prepare('SELECT * FROM timeline_events WHERE container_id = ? ORDER BY created_at DESC').all(req.params.containerId)
    res.json({ success: true, data: rows })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

export default router
