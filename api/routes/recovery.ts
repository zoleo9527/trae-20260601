import { Router, type Request, type Response } from 'express'
import db from '../db.js'
import { authMiddleware } from '../middleware/auth.js'
import { roleMiddleware } from '../middleware/role.js'
import { auditMiddleware } from '../middleware/audit.js'

const router = Router()

router.use(authMiddleware)

router.get('/', (req: Request, res: Response): void => {
  const { status } = req.query

  let sql = `
    SELECT rf.*, r.room_number, u1.name as cleaner_name, u2.name as supervisor_name,
      rj.note as last_reject_note, rj.created_at as last_reject_at, rj_op.name as last_reject_by
    FROM recovery_flows rf
    JOIN rooms r ON rf.room_id = r.id
    LEFT JOIN users u1 ON rf.cleaner_id = u1.id
    LEFT JOIN users u2 ON rf.supervisor_id = u2.id
    LEFT JOIN (
      SELECT rl.recovery_flow_id, rl.note, rl.operator_id, rl.created_at,
        ROW_NUMBER() OVER (PARTITION BY rl.recovery_flow_id ORDER BY rl.created_at DESC) as rn
      FROM recovery_logs rl
      WHERE rl.action = 'rejected'
    ) rj ON rj.recovery_flow_id = rf.id AND rj.rn = 1
    LEFT JOIN users rj_op ON rj.operator_id = rj_op.id
    WHERE 1=1
  `
  const params: any[] = []

  if (status) {
    sql += ' AND rf.status = ?'
    params.push(status)
  }

  sql += ' ORDER BY rf.created_at DESC'

  const flows = db.prepare(sql).all(...params)
  res.json({ success: true, data: flows })
})

router.post(
  '/',
  roleMiddleware(['cleaner']),
  auditMiddleware('recovery_create', (req) => `创建恢复流程 房间${req.body.room_id}`),
  (req: Request, res: Response): void => {
    const { room_id } = req.body

    if (!room_id) {
      res.status(400).json({ success: false, error: '房间ID不能为空' })
      return
    }

    const room = db.prepare('SELECT * FROM rooms WHERE id = ?').get(room_id) as any
    if (!room) {
      res.status(404).json({ success: false, error: '房间不存在' })
      return
    }
    if (room.status !== 'cleaning' && room.status !== 'repair') {
      res.status(400).json({ success: false, error: '房间状态不允许创建恢复流程' })
      return
    }

    const insertFlow = db.prepare(`
      INSERT INTO recovery_flows (room_id, status, cleaner_id)
      VALUES (?, 'pending_clean', ?)
    `)
    const result = insertFlow.run(room_id, req.user!.id)

    db.prepare(
      'INSERT INTO recovery_logs (recovery_flow_id, action, operator_id, note) VALUES (?, ?, ?, ?)'
    ).run(result.lastInsertRowid as number, 'created', req.user!.id, '创建恢复流程')

    const flow = db.prepare('SELECT * FROM recovery_flows WHERE id = ?').get(result.lastInsertRowid)
    res.status(201).json({ success: true, data: flow })
  }
)

router.patch(
  '/:id/clean-complete',
  roleMiddleware(['cleaner']),
  auditMiddleware('recovery_clean_complete', (req) => `保洁完成 恢复流程#${req.params.id}`),
  (req: Request, res: Response): void => {
    const flowId = Number(req.params.id)

    const flow = db.prepare('SELECT * FROM recovery_flows WHERE id = ?').get(flowId) as any
    if (!flow) {
      res.status(404).json({ success: false, error: '恢复流程不存在' })
      return
    }
    if (flow.status !== 'pending_clean') {
      res.status(400).json({ success: false, error: '流程状态不是待保洁' })
      return
    }
    if (flow.cleaner_id !== req.user!.id) {
      res.status(403).json({ success: false, error: '只能完成自己负责的流程' })
      return
    }

    db.prepare(`
      UPDATE recovery_flows SET status = 'pending_inspect', clean_completed_at = datetime('now')
      WHERE id = ?
    `).run(flowId)

    db.prepare(
      'INSERT INTO recovery_logs (recovery_flow_id, action, operator_id, note) VALUES (?, ?, ?, ?)'
    ).run(flowId, 'clean_completed', req.user!.id, '保洁完成')

    db.prepare("UPDATE rooms SET status = 'pending_inspect', last_changed_at = datetime('now') WHERE id = ?").run(flow.room_id)

    const updated = db.prepare('SELECT * FROM recovery_flows WHERE id = ?').get(flowId)
    res.json({ success: true, data: updated })
  }
)

router.patch(
  '/:id/approve',
  roleMiddleware(['supervisor']),
  auditMiddleware('recovery_approve', (req) => `审核通过 恢复流程#${req.params.id}`),
  (req: Request, res: Response): void => {
    const flowId = Number(req.params.id)

    const flow = db.prepare('SELECT * FROM recovery_flows WHERE id = ?').get(flowId) as any
    if (!flow) {
      res.status(404).json({ success: false, error: '恢复流程不存在' })
      return
    }
    if (flow.status !== 'pending_inspect') {
      res.status(400).json({ success: false, error: '流程状态不是待检查' })
      return
    }

    db.prepare(`
      UPDATE recovery_flows
      SET status = 'recovered', supervisor_id = ?, inspected_at = datetime('now'), completed_at = datetime('now')
      WHERE id = ?
    `).run(req.user!.id, flowId)

    db.prepare(
      'INSERT INTO recovery_logs (recovery_flow_id, action, operator_id, note) VALUES (?, ?, ?, ?)'
    ).run(flowId, 'approved', req.user!.id, '主管审核通过')

    db.prepare("UPDATE rooms SET status = 'vacant', current_assignee_id = NULL, last_changed_at = datetime('now') WHERE id = ?").run(flow.room_id)

    const updated = db.prepare('SELECT * FROM recovery_flows WHERE id = ?').get(flowId)
    res.json({ success: true, data: updated })
  }
)

router.patch(
  '/:id/reject',
  roleMiddleware(['supervisor']),
  auditMiddleware('recovery_reject', (req) => `审核驳回 恢复流程#${req.params.id}`),
  (req: Request, res: Response): void => {
    const flowId = Number(req.params.id)
    const { note } = req.body

    const flow = db.prepare('SELECT * FROM recovery_flows WHERE id = ?').get(flowId) as any
    if (!flow) {
      res.status(404).json({ success: false, error: '恢复流程不存在' })
      return
    }
    if (flow.status !== 'pending_inspect') {
      res.status(400).json({ success: false, error: '流程状态不是待检查' })
      return
    }

    db.prepare(`
      UPDATE recovery_flows SET status = 'pending_clean', clean_completed_at = NULL, supervisor_id = ?
      WHERE id = ?
    `).run(req.user!.id, flowId)

    db.prepare(
      'INSERT INTO recovery_logs (recovery_flow_id, action, operator_id, note) VALUES (?, ?, ?, ?)'
    ).run(flowId, 'rejected', req.user!.id, note || '主管审核驳回，需重新保洁')

    db.prepare("UPDATE rooms SET status = 'cleaning', last_changed_at = datetime('now') WHERE id = ?").run(flow.room_id)

    const updated = db.prepare('SELECT * FROM recovery_flows WHERE id = ?').get(flowId)
    res.json({ success: true, data: updated })
  }
)

router.get('/:id', (req: Request, res: Response): void => {
  const flowId = Number(req.params.id)

  const flow = db.prepare(`
    SELECT rf.*, r.room_number, u1.name as cleaner_name, u2.name as supervisor_name,
      rj.note as last_reject_note, rj.created_at as last_reject_at, rj_op.name as last_reject_by
    FROM recovery_flows rf
    JOIN rooms r ON rf.room_id = r.id
    LEFT JOIN users u1 ON rf.cleaner_id = u1.id
    LEFT JOIN users u2 ON rf.supervisor_id = u2.id
    LEFT JOIN (
      SELECT rl.recovery_flow_id, rl.note, rl.operator_id, rl.created_at,
        ROW_NUMBER() OVER (PARTITION BY rl.recovery_flow_id ORDER BY rl.created_at DESC) as rn
      FROM recovery_logs rl
      WHERE rl.action = 'rejected'
    ) rj ON rj.recovery_flow_id = rf.id AND rj.rn = 1
    LEFT JOIN users rj_op ON rj.operator_id = rj_op.id
    WHERE rf.id = ?
  `).get(flowId)

  if (!flow) {
    res.status(404).json({ success: false, error: '恢复流程不存在' })
    return
  }

  res.json({ success: true, data: flow })
})

router.get('/:id/logs', (req: Request, res: Response): void => {
  const flowId = Number(req.params.id)

  const flow = db.prepare('SELECT * FROM recovery_flows WHERE id = ?').get(flowId)
  if (!flow) {
    res.status(404).json({ success: false, error: '恢复流程不存在' })
    return
  }

  const logs = db.prepare(`
    SELECT rl.*, u.name as operator_name
    FROM recovery_logs rl
    LEFT JOIN users u ON rl.operator_id = u.id
    WHERE rl.recovery_flow_id = ?
    ORDER BY rl.created_at ASC
  `).all(flowId)

  res.json({ success: true, data: logs })
})

export default router
