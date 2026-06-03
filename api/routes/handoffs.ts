import { Router, type Request, type Response } from 'express'
import { randomUUID } from 'crypto'
import { getDb } from '../db.js'

const router = Router({ mergeParams: true })

const STAGE_FLOW: Record<string, Record<string, { stage: string; handler: string; status: string }>> = {
  receptionist: {
    submit: { stage: 'design', handler: 'designer', status: 'in_progress' },
    release_material: { stage: 'reception', handler: 'receptionist', status: 'pending' },
  },
  designer: {
    submit: { stage: 'qc', handler: 'inspector', status: 'in_progress' },
    reject: { stage: 'reception', handler: 'receptionist', status: 'pending' },
  },
  inspector: {
    submit: { stage: 'production', handler: 'inspector', status: 'completed' },
    reject: { stage: 'design', handler: 'designer', status: 'in_progress' },
    schedule: { stage: 'production', handler: 'inspector', status: 'completed' },
  },
}

router.get('/', (req: Request, res: Response) => {
  const db = getDb()
  const { id } = req.params

  const order = db.prepare('SELECT id FROM orders WHERE id = ?').get(id)
  if (!order) {
    res.status(404).json({ success: false, error: '工单不存在' })
    return
  }

  const handoffs = db.prepare(
    'SELECT * FROM handoff_records WHERE order_id = ? ORDER BY created_at ASC'
  ).all(id) as Array<{
    id: string
    order_id: string
    from_role: string
    to_role: string
    action: string
    reason: string
    details: string
    created_at: string
  }>

  res.json({
    success: true,
    data: handoffs.map(h => ({
      id: h.id,
      orderId: h.order_id,
      fromRole: h.from_role,
      toRole: h.to_role,
      action: h.action,
      reason: h.reason,
      details: JSON.parse(h.details || '{}'),
      createdAt: h.created_at,
    })),
  })
})

router.post('/', (req: Request, res: Response) => {
  const db = getDb()
  const { id } = req.params

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as {
    id: string
    current_stage: string
    current_handler: string
    status: string
    material_status: string
  } | undefined

  if (!order) {
    res.status(404).json({ success: false, error: '工单不存在' })
    return
  }

  const { fromRole, toRole, action, reason, details } = req.body

  if (!reason || reason.trim() === '') {
    res.status(400).json({ success: false, error: '交接原因不能为空' })
    return
  }

  if (!fromRole || !toRole || !action) {
    res.status(400).json({ success: false, error: '缺少必填字段: fromRole, toRole, action' })
    return
  }

  const validActions = ['submit', 'reject', 'release_material', 'schedule']
  if (!validActions.includes(action)) {
    res.status(400).json({ success: false, error: `action 必须是: ${validActions.join(', ')}` })
    return
  }

  const handoffId = randomUUID()

  const transition = STAGE_FLOW[fromRole]?.[action]

  const transaction = db.transaction(() => {
    db.prepare(`
      INSERT INTO handoff_records (id, order_id, from_role, to_role, action, reason, details, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(handoffId, id, fromRole, toRole, action, reason, JSON.stringify(details || {}))

    if (action === 'release_material') {
      db.prepare(`
        UPDATE orders SET
          material_status = 'complete',
          status = 'pending',
          time_in_stage = 0,
          updated_at = datetime('now')
        WHERE id = ?
      `).run(id)
    } else if (transition) {
      db.prepare(`
        UPDATE orders SET
          current_stage = ?,
          current_handler = ?,
          status = ?,
          time_in_stage = 0,
          updated_at = datetime('now')
        WHERE id = ?
      `).run(transition.stage, transition.handler, transition.status, id)
    } else {
      db.prepare(`
        UPDATE orders SET
          time_in_stage = 0,
          updated_at = datetime('now')
        WHERE id = ?
      `).run(id)
    }
  })

  transaction()

  const handoff = db.prepare('SELECT * FROM handoff_records WHERE id = ?').get(handoffId) as {
    id: string
    order_id: string
    from_role: string
    to_role: string
    action: string
    reason: string
    details: string
    created_at: string
  }

  res.status(201).json({
    success: true,
    data: {
      id: handoff.id,
      orderId: handoff.order_id,
      fromRole: handoff.from_role,
      toRole: handoff.to_role,
      action: handoff.action,
      reason: handoff.reason,
      details: JSON.parse(handoff.details || '{}'),
      createdAt: handoff.created_at,
    },
  })
})

export default router
