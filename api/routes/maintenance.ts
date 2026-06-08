import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import db from '../database.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  const { roomId, status, priority, assignedTo } = req.query
  let sql = `
    SELECT mo.*, r.room_number, r.floor,
      u1.name as reporter_name,
      u2.name as assignee_name
    FROM maintenance_orders mo
    JOIN rooms r ON mo.room_id = r.id
    JOIN users u1 ON mo.reported_by = u1.id
    LEFT JOIN users u2 ON mo.assigned_to = u2.id
    WHERE 1=1
  `
  const params: unknown[] = []

  if (roomId) {
    sql += ' AND mo.room_id = ?'
    params.push(roomId)
  }
  if (status) {
    sql += ' AND mo.status = ?'
    params.push(status)
  }
  if (priority) {
    sql += ' AND mo.priority = ?'
    params.push(priority)
  }
  if (assignedTo) {
    sql += ' AND mo.assigned_to = ?'
    params.push(assignedTo)
  }

  sql += ' ORDER BY mo.reported_at DESC'
  const orders = db.prepare(sql).all(...params as any[])
  res.json({ success: true, data: orders })
})

router.post('/', (req: Request, res: Response): void => {
  const { roomId, reportedBy, faultType, description, priority } = req.body

  if (!roomId || !reportedBy || !faultType) {
    res.status(400).json({ success: false, error: 'roomId, reportedBy, and faultType are required' })
    return
  }

  const id = uuidv4()
  const now = new Date().toISOString()
  const orderPriority = priority || 'normal'

  db.prepare(`
    INSERT INTO maintenance_orders (id, room_id, reported_by, assigned_to, fault_type, description, priority, status, reported_at, completed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, roomId, reportedBy, null, faultType, description || null, orderPriority, 'reported', now, null)

  db.prepare(`
    INSERT INTO timeline_events (id, room_id, event_type, description, operator_id, event_time, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    uuidv4(),
    roomId,
    'maintenance_reported',
    `报修：${faultType}`,
    reportedBy,
    now,
    JSON.stringify({ orderId: id, faultType, priority: orderPriority })
  )

  const order = db.prepare(`
    SELECT mo.*, r.room_number, r.floor,
      u1.name as reporter_name,
      u2.name as assignee_name
    FROM maintenance_orders mo
    JOIN rooms r ON mo.room_id = r.id
    JOIN users u1 ON mo.reported_by = u1.id
    LEFT JOIN users u2 ON mo.assigned_to = u2.id
    WHERE mo.id = ?
  `).get(id)

  res.status(201).json({ success: true, data: order })
})

router.patch('/:id', (req: Request, res: Response): void => {
  const { status, assignedTo } = req.body
  const order = db.prepare('SELECT * FROM maintenance_orders WHERE id = ?').get(req.params.id) as any

  if (!order) {
    res.status(404).json({ success: false, error: 'Maintenance order not found' })
    return
  }

  const now = new Date().toISOString()
  const updates: string[] = []
  const params: unknown[] = []

  if (assignedTo) {
    updates.push('assigned_to = ?')
    params.push(assignedTo)
    if (!status) {
      updates.push('status = ?')
      params.push('assigned')
    }
  }

  if (status) {
    updates.push('status = ?')
    params.push(status)
    if (status === 'completed') {
      updates.push('completed_at = ?')
      params.push(now)
    }
  }

  if (updates.length === 0) {
    res.status(400).json({ success: false, error: 'No fields to update' })
    return
  }

  params.push(req.params.id)
  db.prepare(`UPDATE maintenance_orders SET ${updates.join(', ')} WHERE id = ?`).run(...params as any[])

  const newStatus = status || (assignedTo ? 'assigned' : order.status)
  let eventType = 'maintenance_updated'
  let eventDesc = '维修工单已更新'
  if (newStatus === 'assigned') {
    eventType = 'maintenance_assigned'
    eventDesc = '维修工单已分配'
  } else if (newStatus === 'in_progress') {
    eventType = 'maintenance_in_progress'
    eventDesc = '维修进行中'
  } else if (newStatus === 'completed') {
    eventType = 'maintenance_completed'
    eventDesc = '维修已完成'
  } else if (newStatus === 'verified') {
    eventType = 'maintenance_verified'
    eventDesc = '维修已验证'
  }

  const operatorId = assignedTo || order.reported_by
  db.prepare(`
    INSERT INTO timeline_events (id, room_id, event_type, description, operator_id, event_time, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    uuidv4(),
    order.room_id,
    eventType,
    eventDesc,
    operatorId,
    now,
    JSON.stringify({ orderId: req.params.id, oldStatus: order.status, newStatus })
  )

  const updated = db.prepare(`
    SELECT mo.*, r.room_number, r.floor,
      u1.name as reporter_name,
      u2.name as assignee_name
    FROM maintenance_orders mo
    JOIN rooms r ON mo.room_id = r.id
    JOIN users u1 ON mo.reported_by = u1.id
    LEFT JOIN users u2 ON mo.assigned_to = u2.id
    WHERE mo.id = ?
  `).get(req.params.id)

  res.json({ success: true, data: updated })
})

export default router
