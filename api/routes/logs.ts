import { Router, type Request, type Response } from 'express'
import { getDb } from '../db.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  const db = getDb()
  const { entity_type, entity_id } = req.query

  let sql = 'SELECT * FROM operation_logs WHERE 1=1'
  const params: any[] = []

  if (entity_type) { sql += ' AND entity_type = ?'; params.push(entity_type) }
  if (entity_id) { sql += ' AND entity_id = ?'; params.push(entity_id) }

  sql += ' ORDER BY created_at DESC'

  const logs = db.prepare(sql).all(...params)
  res.json({ success: true, data: logs })
})

export default router
