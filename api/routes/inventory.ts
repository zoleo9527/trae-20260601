import { Router, type Request, type Response } from 'express'
import { getDb } from '../db.js'
import { syncExpiredLocks } from '../lib/lockStatusSync.js'

const router = Router()

router.get('/', (_req: Request, res: Response) => {
  syncExpiredLocks()
  const db = getDb()
  const rows = db.prepare('SELECT * FROM inventory ORDER BY category, name').all()
  res.json({ success: true, data: rows })
})

router.get('/:id', (req: Request, res: Response) => {
  const db = getDb()
  const row = db.prepare('SELECT * FROM inventory WHERE id = ?').get(req.params.id)

  if (!row) {
    res.status(404).json({ success: false, error: 'Inventory not found' })
    return
  }

  res.json({ success: true, data: row })
})

export default router
