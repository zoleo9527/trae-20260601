import { Router, type Request, type Response } from 'express'
import { getDb } from '../db.js'
import { syncExpiredLocks } from '../lib/lockStatusSync.js'

const router = Router()

router.get('/', (_req: Request, res: Response) => {
  syncExpiredLocks()
  const db = getDb()
  const rows = db.prepare('SELECT * FROM customer ORDER BY name').all()
  res.json({ success: true, data: rows })
})

export default router
