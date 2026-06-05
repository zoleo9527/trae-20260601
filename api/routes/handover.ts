import { Router, type Request, type Response } from 'express'
import db from '../db.js'

const router = Router()

router.get('/summary', (_req: Request, res: Response) => {
  const pendingBookings = db.prepare(`SELECT b.*, c.name as course_name, bl.name as belayer_name FROM bookings b LEFT JOIN courses c ON b.course_id = c.id LEFT JOIN belayers bl ON b.belayer_id = bl.id WHERE b.status IN ('pending', 'confirmed', 'in_progress')`).all()
  const unreturnedEquipment = db.prepare('SELECT * FROM equipment_issuances WHERE returned_at IS NULL').all()
  const openAnomalies = db.prepare("SELECT * FROM anomalies WHERE status = 'open'").all()

  res.json({
    success: true,
    data: {
      pending_bookings_count: pendingBookings.length,
      unreturned_equipment_count: unreturnedEquipment.length,
      open_anomalies_count: openAnomalies.length,
      pending_bookings: pendingBookings,
      unreturned_equipment: unreturnedEquipment,
      open_anomalies: openAnomalies,
    },
  })
})

router.post('/snapshot', (req: Request, res: Response) => {
  const { operator_out, operator_in, notes } = req.body
  if (!operator_out || !operator_in) {
    res.status(400).json({ success: false, error: 'operator_out and operator_in are required' })
    return
  }

  const pendingBookingsRows = db.prepare(`SELECT b.id, b.member_name, c.name as course_name, b.booking_date, b.time_slot, b.status FROM bookings b LEFT JOIN courses c ON b.course_id = c.id WHERE b.status IN ('pending', 'confirmed', 'in_progress')`).all() as any[]
  const unreturnedEquipmentRows = db.prepare('SELECT id, member_name, equipment_type, equipment_id, condition_out, issued_by, issued_at FROM equipment_issuances WHERE returned_at IS NULL').all() as any[]
  const openAnomaliesRows = db.prepare("SELECT id, description, severity, reported_by, created_at FROM anomalies WHERE status = 'open'").all() as any[]

  const insertSnapshot = db.prepare('INSERT INTO handover_snapshots (pending_bookings, unreturned_equipment, open_anomalies, operator_out, operator_in, notes) VALUES (?, ?, ?, ?, ?, ?)')
  const insertBooking = db.prepare('INSERT INTO snapshot_bookings (snapshot_id, booking_id, member_name, course_name, booking_date, time_slot, status) VALUES (?, ?, ?, ?, ?, ?, ?)')
  const insertEquipment = db.prepare('INSERT INTO snapshot_equipment (snapshot_id, issuance_id, member_name, equipment_type, equipment_id, condition_out, issued_by, issued_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
  const insertAnomaly = db.prepare('INSERT INTO snapshot_anomalies (snapshot_id, anomaly_id, description, severity, reported_by, created_at) VALUES (?, ?, ?, ?, ?, ?)')

  const tx = db.transaction(() => {
    const result = insertSnapshot.run(pendingBookingsRows.length, unreturnedEquipmentRows.length, openAnomaliesRows.length, operator_out, operator_in, notes || '')
    const snapshotId = Number(result.lastInsertRowid)

    for (const b of pendingBookingsRows) {
      insertBooking.run(snapshotId, b.id, b.member_name, b.course_name, b.booking_date, b.time_slot, b.status)
    }
    for (const e of unreturnedEquipmentRows) {
      insertEquipment.run(snapshotId, e.id, e.member_name, e.equipment_type, e.equipment_id, e.condition_out, e.issued_by, e.issued_at)
    }
    for (const a of openAnomaliesRows) {
      insertAnomaly.run(snapshotId, a.id, a.description, a.severity, a.reported_by, a.created_at)
    }

    return snapshotId
  })

  const snapshotId = tx()
  const snapshot = db.prepare('SELECT * FROM handover_snapshots WHERE id = ?').get(snapshotId)
  res.status(201).json({ success: true, data: snapshot })
})

router.get('/history', (_req: Request, res: Response) => {
  const snapshots = db.prepare('SELECT * FROM handover_snapshots ORDER BY created_at DESC').all()
  res.json({ success: true, data: snapshots })
})

router.get('/todos', (_req: Request, res: Response) => {
  const todos = db.prepare("SELECT * FROM shift_todos ORDER BY CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 END, created_at DESC").all()
  res.json({ success: true, data: todos })
})

router.post('/todos', (req: Request, res: Response) => {
  const { content, priority, created_by } = req.body
  if (!content || !created_by) {
    res.status(400).json({ success: false, error: 'content and created_by are required' })
    return
  }

  const stmt = db.prepare("INSERT INTO shift_todos (content, priority, status, created_by) VALUES (?, ?, 'pending', ?)")
  const result = stmt.run(content, priority || 'medium', created_by)

  const todo = db.prepare('SELECT * FROM shift_todos WHERE id = ?').get(result.lastInsertRowid)
  res.status(201).json({ success: true, data: todo })
})

router.patch('/todos/:id/complete', (req: Request, res: Response) => {
  const { id } = req.params
  const { completed_by } = req.body

  const todo = db.prepare('SELECT * FROM shift_todos WHERE id = ?').get(id) as any
  if (!todo) {
    res.status(404).json({ success: false, error: 'Todo not found' })
    return
  }
  if (todo.status === 'done') {
    res.status(400).json({ success: false, error: 'Todo already completed' })
    return
  }
  if (!completed_by) {
    res.status(400).json({ success: false, error: 'completed_by is required' })
    return
  }

  db.prepare("UPDATE shift_todos SET status = 'done', completed_by = ?, completed_at = datetime('now','localtime') WHERE id = ?").run(completed_by, id)
  const updated = db.prepare('SELECT * FROM shift_todos WHERE id = ?').get(id)
  res.json({ success: true, data: updated })
})

router.get('/snapshots/:id/details', (req: Request, res: Response) => {
  const snapshot = db.prepare('SELECT * FROM handover_snapshots WHERE id = ?').get(req.params.id) as any
  if (!snapshot) {
    res.status(404).json({ success: false, error: 'Snapshot not found' })
    return
  }

  const bookings = db.prepare('SELECT * FROM snapshot_bookings WHERE snapshot_id = ?').all(req.params.id)
  const equipment = db.prepare('SELECT * FROM snapshot_equipment WHERE snapshot_id = ?').all(req.params.id)
  const anomalies = db.prepare('SELECT * FROM snapshot_anomalies WHERE snapshot_id = ?').all(req.params.id)

  res.json({
    success: true,
    data: {
      snapshot,
      bookings,
      equipment,
      anomalies,
    },
  })
})

router.get('/snapshots/:id', (req: Request, res: Response) => {
  const snapshot = db.prepare('SELECT * FROM handover_snapshots WHERE id = ?').get(req.params.id) as any
  if (!snapshot) {
    res.status(404).json({ success: false, error: 'Snapshot not found' })
    return
  }
  res.json({ success: true, data: snapshot })
})

export default router
