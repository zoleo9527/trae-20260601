import { Router, type Request, type Response } from 'express'
import { getDb } from '../db.js'

const router = Router()

router.get('/', (req: Request, res: Response) => {
  const db = getDb()
  const limit = parseInt(req.query.limit as string) || 20

  const events = db.prepare(`
    SELECT te.*, p.tracking_no
    FROM timeline_events te
    JOIN packages p ON te.package_id = p.id
    ORDER BY te.timestamp DESC
    LIMIT ?
  `).all(limit) as any[]

  const result = events.map((evt, idx) => ({
    id: evt.id,
    packageId: evt.package_id,
    trackingNo: evt.tracking_no,
    action: evt.status,
    operator: evt.operator,
    role: evt.role,
    timestamp: evt.timestamp,
  }))

  res.json({ success: true, data: result })
})

export default router
