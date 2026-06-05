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

  const pendingBookings = db.prepare("SELECT COUNT(*) as cnt FROM bookings WHERE status IN ('pending', 'confirmed', 'in_progress')").get() as { cnt: number }
  const unreturnedEquipment = db.prepare('SELECT COUNT(*) as cnt FROM equipment_issuances WHERE returned_at IS NULL').get() as { cnt: number }
  const openAnomalies = db.prepare("SELECT COUNT(*) as cnt FROM anomalies WHERE status = 'open'").get() as { cnt: number }

  const stmt = db.prepare('INSERT INTO handover_snapshots (pending_bookings, unreturned_equipment, open_anomalies, operator_out, operator_in, notes) VALUES (?, ?, ?, ?, ?, ?)')
  const result = stmt.run(pendingBookings.cnt, unreturnedEquipment.cnt, openAnomalies.cnt, operator_out, operator_in, notes || '')

  const snapshot = db.prepare('SELECT * FROM handover_snapshots WHERE id = ?').get(result.lastInsertRowid)
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

router.get('/snapshots/:id', (req: Request, res: Response) => {
  const snapshot = db.prepare('SELECT * FROM handover_snapshots WHERE id = ?').get(req.params.id) as any
  if (!snapshot) {
    res.status(404).json({ success: false, error: 'Snapshot not found' })
    return
  }
  res.json({ success: true, data: snapshot })
})

export default router
