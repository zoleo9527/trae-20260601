import { Router, type Request, type Response } from 'express'
import db from '../db.js'
import { authMiddleware } from '../middleware/auth.js'
import { roleMiddleware } from '../middleware/role.js'
import { auditMiddleware } from '../middleware/audit.js'

const router = Router()

router.use(authMiddleware)

router.get('/', (req: Request, res: Response): void => {
  const { status, assigned_to } = req.query
  const user = req.user!

  let sql = `
    SELECT ro.*, r.room_number, u1.name as creator_name, u2.name as assignee_name
    FROM repair_orders ro
    JOIN rooms r ON ro.room_id = r.id
    LEFT JOIN users u1 ON ro.created_by = u1.id
    LEFT JOIN users u2 ON ro.assigned_to = u2.id
    WHERE 1=1
  `
  const params: any[] = []

  if (user.role === 'cleaner') {
    sql += ' AND ro.created_by = ?'
    params.push(user.id)
  } else if (user.role === 'engineer') {
    sql += ' AND (ro.assigned_to = ? OR ro.status = ?)'
    params.push(user.id, 'pending')
  }

  if (status) {
    sql += ' AND ro.status = ?'
    params.push(status)
  }
  if (assigned_to) {
    sql += ' AND ro.assigned_to = ?'
    params.push(Number(assigned_to))
  }

  sql += ' ORDER BY ro.created_at DESC'

  const repairs = db.prepare(sql).all(...params)
  res.json({ success: true, data: repairs })
})

router.post(
  '/',
  roleMiddleware(['cleaner', 'supervisor']),
  auditMiddleware('repair_create', (req) => `创建维修工单 房间${req.body.room_id}`),
  (req: Request, res: Response): void => {
    const { room_id, fault_type, description, urgency = 'normal' } = req.body

    if (!room_id || !fault_type) {
      res.status(400).json({ success: false, error: '房间ID和故障类型不能为空' })
      return
    }

    const room = db.prepare('SELECT * FROM rooms WHERE id = ?').get(room_id)
    if (!room) {
      res.status(404).json({ success: false, error: '房间不存在' })
      return
    }

    const insertRepair = db.prepare(`
      INSERT INTO repair_orders (room_id, fault_type, description, urgency, status, created_by)
      VALUES (?, ?, ?, ?, 'pending', ?)
    `)
    const result = insertRepair.run(room_id, fault_type, description || null, urgency, req.user!.id)

    const insertLog = db.prepare(
      'INSERT INTO repair_logs (repair_order_id, action, operator_id, note) VALUES (?, ?, ?, ?)'
    )
    insertLog.run(result.lastInsertRowid as number, 'created', req.user!.id, '创建维修工单')

    db.prepare("UPDATE rooms SET status = 'repair', last_changed_at = datetime('now') WHERE id = ?").run(room_id)

    const repair = db.prepare('SELECT * FROM repair_orders WHERE id = ?').get(result.lastInsertRowid)
    res.status(201).json({ success: true, data: repair })
  }
)

router.patch(
  '/:id/accept',
  roleMiddleware(['engineer']),
  auditMiddleware('repair_accept', (req) => `接单 维修工单#${req.params.id}`),
  (req: Request, res: Response): void => {
    const repairId = Number(req.params.id)

    const repair = db.prepare('SELECT * FROM repair_orders WHERE id = ?').get(repairId) as any
    if (!repair) {
      res.status(404).json({ success: false, error: '维修工单不存在' })
      return
    }
    if (repair.status !== 'pending') {
      res.status(400).json({ success: false, error: '工单状态不是待处理' })
      return
    }

    db.prepare(`
      UPDATE repair_orders SET status = 'in_progress', assigned_to = ?, assigned_at = datetime('now')
      WHERE id = ?
    `).run(req.user!.id, repairId)

    db.prepare(
      'INSERT INTO repair_logs (repair_order_id, action, operator_id, note) VALUES (?, ?, ?, ?)'
    ).run(repairId, 'accepted', req.user!.id, '工程师接单')

    const updated = db.prepare('SELECT * FROM repair_orders WHERE id = ?').get(repairId)
    res.json({ success: true, data: updated })
  }
)

router.patch(
  '/:id/complete',
  roleMiddleware(['engineer']),
  auditMiddleware('repair_complete', (req) => `完成 维修工单#${req.params.id}`),
  (req: Request, res: Response): void => {
    const repairId = Number(req.params.id)

    const repair = db.prepare('SELECT * FROM repair_orders WHERE id = ?').get(repairId) as any
    if (!repair) {
      res.status(404).json({ success: false, error: '维修工单不存在' })
      return
    }
    if (repair.status !== 'in_progress') {
      res.status(400).json({ success: false, error: '工单状态不是进行中' })
      return
    }

    db.prepare(`
      UPDATE repair_orders SET status = 'completed', completed_at = datetime('now')
      WHERE id = ?
    `).run(repairId)

    db.prepare(
      'INSERT INTO repair_logs (repair_order_id, action, operator_id, note) VALUES (?, ?, ?, ?)'
    ).run(repairId, 'completed', req.user!.id, '工程师完成维修')

    db.prepare("UPDATE rooms SET status = 'cleaning', last_changed_at = datetime('now') WHERE id = ?").run(repair.room_id)

    const updated = db.prepare('SELECT * FROM repair_orders WHERE id = ?').get(repairId)
    res.json({ success: true, data: updated })
  }
)

router.get('/:id', (req: Request, res: Response): void => {
  const repairId = Number(req.params.id)

  const repair = db.prepare(`
    SELECT ro.*, r.room_number, u1.name as creator_name, u2.name as assignee_name
    FROM repair_orders ro
    JOIN rooms r ON ro.room_id = r.id
    LEFT JOIN users u1 ON ro.created_by = u1.id
    LEFT JOIN users u2 ON ro.assigned_to = u2.id
    WHERE ro.id = ?
  `).get(repairId)

  if (!repair) {
    res.status(404).json({ success: false, error: '维修工单不存在' })
    return
  }

  res.json({ success: true, data: repair })
})

router.get('/:id/logs', (req: Request, res: Response): void => {
  const repairId = Number(req.params.id)

  const repair = db.prepare('SELECT * FROM repair_orders WHERE id = ?').get(repairId)
  if (!repair) {
    res.status(404).json({ success: false, error: '维修工单不存在' })
    return
  }

  const logs = db.prepare(`
    SELECT rl.*, u.name as operator_name
    FROM repair_logs rl
    LEFT JOIN users u ON rl.operator_id = u.id
    WHERE rl.repair_order_id = ?
    ORDER BY rl.created_at ASC
  `).all(repairId)

  res.json({ success: true, data: logs })
})

export default router
