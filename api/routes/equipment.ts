import { Router, type Request, type Response } from 'express'
import db from '../db.js'

const router = Router()

router.get('/', (req: Request, res: Response) => {
  const { date, date_from, date_to, status, member } = req.query
  let sql = 'SELECT * FROM equipment_issuances WHERE 1=1'
  const params: any[] = []

  if (date) {
    sql += ' AND date(issued_at) = ?'
    params.push(date)
  }
  if (date_from) {
    sql += ' AND date(issued_at) >= ?'
    params.push(date_from)
  }
  if (date_to) {
    sql += ' AND date(issued_at) <= ?'
    params.push(date_to)
  }
  if (status === 'returned') {
    sql += ' AND returned_at IS NOT NULL'
  } else if (status === 'unreturned') {
    sql += ' AND returned_at IS NULL'
  }
  if (member) {
    sql += ' AND member_name LIKE ?'
    params.push(`%${member}%`)
  }
  sql += ' ORDER BY issued_at DESC'

  const issuances = db.prepare(sql).all(...params)
  res.json({ success: true, data: issuances })
})

router.post('/', (req: Request, res: Response) => {
  const idempotencyKey = req.headers['x-idempotency-key'] as string
  if (!idempotencyKey) {
    res.status(400).json({ success: false, error: 'X-Idempotency-Key header is required' })
    return
  }

  const existing = db.prepare('SELECT * FROM equipment_issuances WHERE idempotency_key = ?').get(idempotencyKey) as any
  if (existing) {
    res.status(200).json({ success: true, data: existing })
    return
  }

  const { booking_id, member_name, equipment_type, equipment_id, condition_out, issued_by } = req.body
  if (!member_name || !equipment_type || !equipment_id || !issued_by) {
    res.status(400).json({ success: false, error: 'Missing required fields' })
    return
  }

  const stmt = db.prepare(`INSERT INTO equipment_issuances (booking_id, member_name, equipment_type, equipment_id, condition_out, issued_by, idempotency_key) VALUES (?, ?, ?, ?, ?, ?, ?)`)
  const result = stmt.run(booking_id ?? null, member_name, equipment_type, equipment_id, condition_out || '良好', issued_by, idempotencyKey)

  const issuance = db.prepare('SELECT * FROM equipment_issuances WHERE id = ?').get(result.lastInsertRowid)
  res.status(201).json({ success: true, data: issuance })
})

router.patch('/:id/return', (req: Request, res: Response) => {
  const { id } = req.params
  const { condition_in, returned_by } = req.body

  const issuance = db.prepare('SELECT * FROM equipment_issuances WHERE id = ?').get(id) as any
  if (!issuance) {
    res.status(404).json({ success: false, error: 'Issuance not found' })
    return
  }
  if (issuance.returned_at) {
    res.status(400).json({ success: false, error: 'Equipment already returned' })
    return
  }

  db.prepare("UPDATE equipment_issuances SET condition_in = ?, returned_by = ?, returned_at = datetime('now','localtime') WHERE id = ?").run(condition_in || '良好', returned_by, id)
  const updated = db.prepare('SELECT * FROM equipment_issuances WHERE id = ?').get(id)
  res.json({ success: true, data: updated })
})

export default router
