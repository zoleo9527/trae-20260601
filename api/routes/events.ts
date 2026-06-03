import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import db from '../db/index.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  const { status } = req.query
  let rows
  if (status && status !== 'all') {
    rows = db.prepare('SELECT * FROM events WHERE status = ? ORDER BY created_at DESC').all(status as string)
  } else {
    rows = db.prepare('SELECT * FROM events ORDER BY created_at DESC').all()
  }
  res.json({ success: true, data: rows })
})

router.post('/', (req: Request, res: Response): void => {
  const { name, clientName, eventDate, venue, tables, menuPrice, totalAmount, createdBy } = req.body
  if (!name || !clientName || !eventDate || !venue || !tables || !menuPrice || !totalAmount || !createdBy) {
    res.status(400).json({ success: false, error: 'Missing required fields' })
    return
  }
  const id = uuidv4()
  db.prepare(
    `INSERT INTO events (id, name, client_name, event_date, venue, tables, menu_price, total_amount, status, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`
  ).run(id, name, clientName, eventDate, venue, tables, menuPrice, totalAmount, createdBy)

  db.prepare(
    `INSERT INTO timeline_entries (id, event_id, type, title, description, performed_by, role, timestamp)
     VALUES (?, ?, 'event_created', '活动创建', ?, ?, 'sales', datetime('now'))`
  ).run(uuidv4(), id, `创建${name}活动`, createdBy)

  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(id)
  res.json({ success: true, data: event })
})

router.get('/:id', (req: Request, res: Response): void => {
  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id)
  if (!event) {
    res.status(404).json({ success: false, error: 'Event not found' })
    return
  }
  res.json({ success: true, data: event })
})

export default router
