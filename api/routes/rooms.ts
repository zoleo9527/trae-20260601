import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import db from '../database.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  const { floor, status } = req.query
  let sql = 'SELECT * FROM rooms WHERE 1=1'
  const params: unknown[] = []

  if (floor) {
    sql += ' AND floor = ?'
    params.push(Number(floor))
  }
  if (status) {
    sql += ' AND status = ?'
    params.push(status)
  }

  sql += ' ORDER BY floor, CAST(room_number AS INTEGER)'
  const rooms = db.prepare(sql).all(...params as any[])
  res.json({ success: true, data: rooms })
})

router.get('/:id', (req: Request, res: Response): void => {
  const room = db.prepare('SELECT * FROM rooms WHERE id = ?').get(req.params.id) as any
  if (!room) {
    res.status(404).json({ success: false, error: 'Room not found' })
    return
  }

  const timeline = db.prepare(
    'SELECT * FROM timeline_events WHERE room_id = ? ORDER BY event_time DESC'
  ).all(req.params.id)

  res.json({ success: true, data: { ...room, timeline } })
})

router.patch('/:id/status', (req: Request, res: Response): void => {
  const { status, operatorId } = req.body
  if (!status || !operatorId) {
    res.status(400).json({ success: false, error: 'status and operatorId are required' })
    return
  }

  const room = db.prepare('SELECT * FROM rooms WHERE id = ?').get(req.params.id) as { id: string; status: string; room_number: string } | undefined
  if (!room) {
    res.status(404).json({ success: false, error: 'Room not found' })
    return
  }

  const oldStatus = room.status
  const now = new Date().toISOString()

  db.prepare('UPDATE rooms SET status = ?, updated_at = ? WHERE id = ?').run(status, now, req.params.id)

  db.prepare(`
    INSERT INTO timeline_events (id, room_id, event_type, description, operator_id, event_time, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    uuidv4(),
    req.params.id,
    'status_change',
    `房间状态变更为${status}`,
    operatorId,
    now,
    JSON.stringify({ oldStatus, newStatus: status })
  )

  const updated = db.prepare('SELECT * FROM rooms WHERE id = ?').get(req.params.id)
  res.json({ success: true, data: updated })
})

export default router
