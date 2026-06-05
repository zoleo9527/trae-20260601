import { Router, type Request, type Response } from 'express'
import db from '../db.js'

const router = Router()

const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
}

router.get('/', (req: Request, res: Response) => {
  const { date, status } = req.query
  let sql = `SELECT b.*, c.name as course_name, bl.name as belayer_name FROM bookings b LEFT JOIN courses c ON b.course_id = c.id LEFT JOIN belayers bl ON b.belayer_id = bl.id WHERE 1=1`
  const params: any[] = []

  if (date) {
    sql += ' AND b.booking_date = ?'
    params.push(date)
  }
  if (status) {
    sql += ' AND b.status = ?'
    params.push(status)
  }
  sql += ' ORDER BY b.created_at DESC'

  const bookings = db.prepare(sql).all(...params)
  res.json({ success: true, data: bookings })
})

router.post('/', (req: Request, res: Response) => {
  const idempotencyKey = req.headers['x-idempotency-key'] as string
  if (!idempotencyKey) {
    res.status(400).json({ success: false, error: 'X-Idempotency-Key header is required' })
    return
  }

  const existing = db.prepare('SELECT * FROM bookings WHERE idempotency_key = ?').get(idempotencyKey) as any
  if (existing) {
    const bookingWithNames = db.prepare(`SELECT b.*, c.name as course_name, bl.name as belayer_name FROM bookings b LEFT JOIN courses c ON b.course_id = c.id LEFT JOIN belayers bl ON b.belayer_id = bl.id WHERE b.id = ?`).get(existing.id)
    res.status(200).json({ success: true, data: bookingWithNames })
    return
  }

  const { member_name, member_phone, course_id, belayer_id, booking_date, time_slot } = req.body
  if (!member_name || !member_phone || !course_id || !booking_date || !time_slot) {
    res.status(400).json({ success: false, error: 'Missing required fields' })
    return
  }

  const stmt = db.prepare(`INSERT INTO bookings (member_name, member_phone, course_id, belayer_id, booking_date, time_slot, status, idempotency_key) VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)`)
  const result = stmt.run(member_name, member_phone, course_id, belayer_id ?? null, booking_date, time_slot, idempotencyKey)

  const booking = db.prepare(`SELECT b.*, c.name as course_name, bl.name as belayer_name FROM bookings b LEFT JOIN courses c ON b.course_id = c.id LEFT JOIN belayers bl ON b.belayer_id = bl.id WHERE b.id = ?`).get(result.lastInsertRowid)
  res.status(201).json({ success: true, data: booking })
})

router.patch('/:id/status', (req: Request, res: Response) => {
  const { id } = req.params
  const { status } = req.body

  const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(id) as any
  if (!booking) {
    res.status(404).json({ success: false, error: 'Booking not found' })
    return
  }

  const allowed = VALID_TRANSITIONS[booking.status]
  if (!allowed || !allowed.includes(status)) {
    res.status(400).json({ success: false, error: `Invalid transition from ${booking.status} to ${status}` })
    return
  }

  db.prepare("UPDATE bookings SET status = ?, updated_at = datetime('now','localtime') WHERE id = ?").run(status, id)
  const updated = db.prepare(`SELECT b.*, c.name as course_name, bl.name as belayer_name FROM bookings b LEFT JOIN courses c ON b.course_id = c.id LEFT JOIN belayers bl ON b.belayer_id = bl.id WHERE b.id = ?`).get(id)
  res.json({ success: true, data: updated })
})

export default router
