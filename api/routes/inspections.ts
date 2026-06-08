import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import db from '../database.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  const { roomId, inspectorId, date, status } = req.query
  let sql = `
    SELECT i.*, u.name as inspector_name, r.room_number
    FROM inspections i
    JOIN users u ON i.inspector_id = u.id
    JOIN rooms r ON i.room_id = r.id
    WHERE 1=1
  `
  const params: unknown[] = []

  if (roomId) {
    sql += ' AND i.room_id = ?'
    params.push(roomId)
  }
  if (inspectorId) {
    sql += ' AND i.inspector_id = ?'
    params.push(inspectorId)
  }
  if (date) {
    sql += " AND DATE(i.scheduled_at) = ?"
    params.push(date)
  }
  if (status) {
    sql += ' AND i.status = ?'
    params.push(status)
  }

  sql += ' ORDER BY i.scheduled_at DESC'
  const inspections = db.prepare(sql).all(...params as any[])

  const result = inspections.map((insp: any) => {
    const items = db.prepare('SELECT * FROM inspection_items WHERE inspection_id = ?').all(insp.id)
    return { ...insp, items }
  })

  res.json({ success: true, data: result })
})

router.post('/', (req: Request, res: Response): void => {
  const { roomId, inspectorId, items, scheduledAt, status } = req.body

  if (!roomId || !inspectorId || !items || !Array.isArray(items)) {
    res.status(400).json({ success: false, error: 'roomId, inspectorId, and items array are required' })
    return
  }

  const id = uuidv4()
  const now = new Date().toISOString()
  const inspStatus = status || 'pending'
  const scheduled = scheduledAt || now

  db.prepare(`
    INSERT INTO inspections (id, room_id, inspector_id, status, scheduled_at, completed_at, reviewed_by, reviewed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, roomId, inspectorId, inspStatus, scheduled, null, null, null)

  const insertItem = db.prepare(`
    INSERT INTO inspection_items (id, inspection_id, item_name, checked, is_missed, note)
    VALUES (?, ?, ?, ?, ?, ?)
  `)

  for (const item of items) {
    insertItem.run(
      uuidv4(),
      id,
      item.itemName || item.item_name,
      item.checked ? 1 : 0,
      item.isMissed || item.is_missed ? 1 : 0,
      item.note || null
    )
  }

  db.prepare(`
    INSERT INTO timeline_events (id, room_id, event_type, description, operator_id, event_time, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    uuidv4(),
    roomId,
    'inspection_created',
    '创建查房记录',
    inspectorId,
    now,
    JSON.stringify({ inspectionId: id })
  )

  const inspection = db.prepare('SELECT * FROM inspections WHERE id = ?').get(id) as any
  const inspItems = db.prepare('SELECT * FROM inspection_items WHERE inspection_id = ?').all(id)

  res.status(201).json({ success: true, data: { ...inspection, items: inspItems } })
})

router.patch('/:id', (req: Request, res: Response): void => {
  const { status, reviewedBy, reviewNote } = req.body
  const inspection = db.prepare('SELECT * FROM inspections WHERE id = ?').get(req.params.id) as any

  if (!inspection) {
    res.status(404).json({ success: false, error: 'Inspection not found' })
    return
  }

  const now = new Date().toISOString()
  const updates: string[] = []
  const params: unknown[] = []

  if (status) {
    updates.push('status = ?')
    params.push(status)
    if (status === 'completed') {
      updates.push('completed_at = ?')
      params.push(now)
    }
  }

  if (reviewedBy) {
    updates.push('reviewed_by = ?')
    params.push(reviewedBy)
    updates.push('reviewed_at = ?')
    params.push(now)
    if (!status) {
      updates.push('status = ?')
      params.push('reviewed')
    }
  }

  if (updates.length === 0) {
    res.status(400).json({ success: false, error: 'No fields to update' })
    return
  }

  params.push(req.params.id)
  db.prepare(`UPDATE inspections SET ${updates.join(', ')} WHERE id = ?`).run(...params as any[])

  if (status === 'completed' || reviewedBy) {
    const eventType = reviewedBy ? 'inspection_reviewed' : 'inspection_completed'
    const description = reviewedBy ? '查房记录已复核' : '查房完成'
    const operatorId = reviewedBy || inspection.inspector_id
    db.prepare(`
      INSERT INTO timeline_events (id, room_id, event_type, description, operator_id, event_time, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      uuidv4(),
      inspection.room_id,
      eventType,
      description,
      operatorId,
      now,
      JSON.stringify({ inspectionId: req.params.id, reviewNote: reviewNote || null })
    )
  }

  const updated = db.prepare('SELECT * FROM inspections WHERE id = ?').get(req.params.id) as any
  const items = db.prepare('SELECT * FROM inspection_items WHERE inspection_id = ?').all(req.params.id)
  res.json({ success: true, data: { ...updated, items } })
})

export default router
