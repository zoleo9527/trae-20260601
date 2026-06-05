import { Router, type Request, type Response } from 'express'
import db from '../db.js'

const router = Router()

router.get('/', (req: Request, res: Response) => {
  const { status, severity } = req.query
  let sql = 'SELECT * FROM anomalies WHERE 1=1'
  const params: any[] = []

  if (status) {
    sql += ' AND status = ?'
    params.push(status)
  }
  if (severity) {
    sql += ' AND severity = ?'
    params.push(severity)
  }
  sql += ' ORDER BY created_at DESC'

  const anomalies = db.prepare(sql).all(...params)
  res.json({ success: true, data: anomalies })
})

router.post('/', (req: Request, res: Response) => {
  const { booking_id, issuance_id, description, severity, reported_by } = req.body
  if (!description || !reported_by) {
    res.status(400).json({ success: false, error: 'Missing required fields' })
    return
  }

  const stmt = db.prepare(`INSERT INTO anomalies (booking_id, issuance_id, description, severity, status, reported_by) VALUES (?, ?, ?, ?, 'open', ?)`)
  const result = stmt.run(booking_id ?? null, issuance_id ?? null, description, severity || 'medium', reported_by)

  const anomaly = db.prepare('SELECT * FROM anomalies WHERE id = ?').get(result.lastInsertRowid)
  res.status(201).json({ success: true, data: anomaly })
})

router.patch('/:id/resolve', (req: Request, res: Response) => {
  const { id } = req.params
  const { resolution, resolved_by } = req.body

  const anomaly = db.prepare('SELECT * FROM anomalies WHERE id = ?').get(id) as any
  if (!anomaly) {
    res.status(404).json({ success: false, error: 'Anomaly not found' })
    return
  }
  if (anomaly.status === 'resolved') {
    res.status(400).json({ success: false, error: 'Anomaly already resolved' })
    return
  }
  if (!resolution || !resolved_by) {
    res.status(400).json({ success: false, error: 'resolution and resolved_by are required' })
    return
  }

  db.prepare("UPDATE anomalies SET status = 'resolved', resolution = ?, resolved_by = ?, resolved_at = datetime('now','localtime') WHERE id = ?").run(resolution, resolved_by, id)
  const updated = db.prepare('SELECT * FROM anomalies WHERE id = ?').get(id)
  res.json({ success: true, data: updated })
})

export default router
