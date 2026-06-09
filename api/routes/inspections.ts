import { Router, type Response } from 'express'
import { getDb } from '../database.js'
import { detectProblems } from '../detect.js'
import { authMiddleware, type AuthRequest } from '../middleware/auth.js'

const router = Router()

router.use(authMiddleware)

router.get('/', (req: AuthRequest, res: Response): void => {
  const db = getDb()
  const { status, type, container_id } = req.query

  let where = '1=1'
  const params: any[] = []

  if (status) {
    where += ' AND i.status = ?'
    params.push(status)
  }
  if (type) {
    where += ' AND i.type = ?'
    params.push(type)
  }
  if (container_id) {
    where += ' AND i.container_id = ?'
    params.push(container_id)
  }

  const rows = db.prepare(
    `SELECT i.*, c.container_no, c.yard_slot FROM inspections i JOIN containers c ON i.container_id = c.id WHERE ${where} ORDER BY i.planned_at DESC`
  ).all(...params)

  res.json({ success: true, data: rows })
})

router.post('/', (req: AuthRequest, res: Response): void => {
  const { container_id, type, planned_at } = req.body
  if (!container_id || !type || !planned_at) {
    res.status(400).json({ success: false, error: '缺少必填字段' })
    return
  }

  const db = getDb()
  const container = db.prepare('SELECT * FROM containers WHERE id = ?').get(container_id) as any
  if (!container) {
    res.status(404).json({ success: false, error: '集装箱不存在' })
    return
  }

  const result = db.prepare(
    `INSERT INTO inspections (container_id, type, status, planned_at, step) VALUES (?, ?, 'planned', ?, 'open_box')`
  ).run(container_id, type, planned_at)

  db.prepare('INSERT INTO operation_logs (user_id, username, role, action, container_no, detail) VALUES (?, ?, ?, ?, ?, ?)').run(
    req.user!.id, req.user!.username, req.user!.role, 'inspection_create', container.container_no, `创建查验计划: ${type}`
  )

  const inspection = db.prepare('SELECT * FROM inspections WHERE id = ?').get(result.lastInsertRowid)
  try { detectProblems(container_id) } catch {}
  res.status(201).json({ success: true, data: inspection })
})

router.put('/:id/execute', (req: AuthRequest, res: Response): void => {
  const { step, result: inspectResult } = req.body
  if (!step) {
    res.status(400).json({ success: false, error: '缺少step字段' })
    return
  }

  const validSteps = ['open_box', 'unpack', 'repack', 'result']
  if (!validSteps.includes(step)) {
    res.status(400).json({ success: false, error: '无效的查验步骤' })
    return
  }

  const db = getDb()
  const inspection = db.prepare('SELECT * FROM inspections WHERE id = ?').get(req.params.id) as any
  if (!inspection) {
    res.status(404).json({ success: false, error: '查验记录不存在' })
    return
  }

  const now = new Date().toISOString().replace('T', ' ').slice(0, 19)
  const container = db.prepare('SELECT * FROM containers WHERE id = ?').get(inspection.container_id) as any

  const updateFields: string[] = ['step = ?']
  const updateParams: any[] = [step]

  if (step === 'open_box') {
    updateFields.push('status = ?')
    updateParams.push('executing')
    db.prepare('UPDATE containers SET status = ? WHERE id = ?').run('inspecting', inspection.container_id)
  }

  if (step === 'result') {
    if (!inspectResult) {
      res.status(400).json({ success: false, error: 'result步骤需要提供result字段' })
      return
    }
    updateFields.push('result = ?', 'status = ?', 'completed_at = ?')
    updateParams.push(inspectResult, 'completed', now)

    db.prepare('UPDATE containers SET status = ? WHERE id = ?').run('inspection_done', inspection.container_id)

    if (inspectResult === 'released') {
      const toSlot = `D-${String(Math.floor(Math.random() * 5) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 10) + 1).padStart(2, '0')}`
      db.prepare(
        `INSERT INTO move_tasks (container_id, source_inspection_id, from_slot, to_slot, reason, status, created_at) VALUES (?, ?, ?, ?, '查验放行后移至出场区', 'pending', ?)`
      ).run(inspection.container_id, inspection.id, container.yard_slot, toSlot, now)
    }
  }

  updateParams.push(req.params.id)
  db.prepare(`UPDATE inspections SET ${updateFields.join(', ')} WHERE id = ?`).run(...updateParams)

  db.prepare('INSERT INTO operation_logs (user_id, username, role, action, container_no, detail) VALUES (?, ?, ?, ?, ?, ?)').run(
    req.user!.id, req.user!.username, req.user!.role, 'inspection_execute', container.container_no, `执行查验步骤: ${step}${inspectResult ? `, 结果: ${inspectResult}` : ''}`
  )

  try { detectProblems(inspection.container_id) } catch {}

  const updated = db.prepare('SELECT * FROM inspections WHERE id = ?').get(req.params.id)
  res.json({ success: true, data: updated })
})

router.put('/:id/notify', (req: AuthRequest, res: Response): void => {
  const { notify_method } = req.body
  if (!notify_method) {
    res.status(400).json({ success: false, error: '缺少notify_method字段' })
    return
  }

  const db = getDb()
  const inspection = db.prepare('SELECT * FROM inspections WHERE id = ?').get(req.params.id) as any
  if (!inspection) {
    res.status(404).json({ success: false, error: '查验记录不存在' })
    return
  }

  const now = new Date().toISOString().replace('T', ' ').slice(0, 19)
  db.prepare('UPDATE inspections SET notified_at = ?, notify_method = ?, status = ? WHERE id = ?').run(now, notify_method, 'notified', req.params.id)

  const container = db.prepare('SELECT * FROM containers WHERE id = ?').get(inspection.container_id) as any

  const missedProblems = db.prepare(
    `SELECT * FROM problem_orders WHERE inspection_id = ? AND type = 'missed_notify' AND status = 'open'`
  ).all(inspection.id) as any[]

  for (const prob of missedProblems) {
    db.prepare('UPDATE problem_orders SET status = ?, resolved_at = ? WHERE id = ?').run('resolved', now, prob.id)
  }

  db.prepare('INSERT INTO operation_logs (user_id, username, role, action, container_no, detail) VALUES (?, ?, ?, ?, ?, ?)').run(
    req.user!.id, req.user!.username, req.user!.role, 'inspection_notify', container.container_no, `通知客户: ${notify_method}${missedProblems.length > 0 ? `, 自动关闭${missedProblems.length}个漏通知问题单` : ''}`
  )

  try { detectProblems(inspection.container_id) } catch {}

  const updated = db.prepare('SELECT * FROM inspections WHERE id = ?').get(req.params.id)
  res.json({ success: true, data: updated })
})

export default router
