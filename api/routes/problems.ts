import { Router, type Response } from 'express'
import { getDb } from '../database.js'
import { detectProblems } from '../detect.js'
import { authMiddleware, type AuthRequest } from '../middleware/auth.js'

const router = Router()

router.use(authMiddleware)

router.get('/', (req: AuthRequest, res: Response): void => {
  const db = getDb()
  const { type, status, severity, inspection_id, container_id } = req.query

  let where = '1=1'
  const params: any[] = []

  if (type) {
    where += ' AND po.type = ?'
    params.push(type)
  }
  if (status) {
    where += ' AND po.status = ?'
    params.push(status)
  }
  if (severity) {
    where += ' AND po.severity = ?'
    params.push(severity)
  }
  if (inspection_id) {
    where += ' AND po.inspection_id = ?'
    params.push(inspection_id)
  }
  if (container_id) {
    where += ' AND po.container_id = ?'
    params.push(container_id)
  }

  const rows = db.prepare(
    `SELECT po.*, c.container_no, c.yard_slot FROM problem_orders po JOIN containers c ON po.container_id = c.id WHERE ${where} ORDER BY po.detected_at DESC`
  ).all(...params)

  res.json({ success: true, data: rows })
})

router.get('/stats', (_req: AuthRequest, res: Response): void => {
  const db = getDb()

  const bySeverity = db.prepare(
    `SELECT severity, COUNT(*) as count FROM problem_orders WHERE status NOT IN ('resolved', 'rejected') GROUP BY severity`
  ).all() as any[]
  const byType = db.prepare(
    `SELECT type, COUNT(*) as count FROM problem_orders WHERE status NOT IN ('resolved', 'rejected') GROUP BY type`
  ).all() as any[]
  const openCount = (db.prepare(
    `SELECT COUNT(*) as count FROM problem_orders WHERE status = 'open'`
  ).get() as any).count

  const severityMap: Record<string, number> = {}
  for (const row of bySeverity) severityMap[row.severity] = row.count
  const typeMap: Record<string, number> = {}
  for (const row of byType) typeMap[row.type] = row.count

  res.json({ success: true, data: { bySeverity: severityMap, byType: typeMap, openCount } })
})

router.get('/:id', (req: AuthRequest, res: Response): void => {
  const db = getDb()
  const problem = db.prepare('SELECT * FROM problem_orders WHERE id = ?').get(req.params.id) as any
  if (!problem) {
    res.status(404).json({ success: false, error: '问题单不存在' })
    return
  }

  const container = db.prepare('SELECT * FROM containers WHERE id = ?').get(problem.container_id)
  let inspection = null
  if (problem.inspection_id) {
    inspection = db.prepare('SELECT * FROM inspections WHERE id = ?').get(problem.inspection_id)
  }
  let moveTask = null
  if (problem.move_task_id) {
    moveTask = db.prepare('SELECT * FROM move_tasks WHERE id = ?').get(problem.move_task_id)
  }
  const relatedLogs = db.prepare(
    `SELECT * FROM operation_logs WHERE container_no = ? ORDER BY created_at DESC LIMIT 10`
  ).all((container as any)?.container_no)

  res.json({ success: true, data: { problem, container, inspection, moveTask, relatedLogs } })
})

router.post('/detect', (req: AuthRequest, res: Response): void => {
  const { container_id } = req.body || {}
  const detected = detectProblems(container_id ? Number(container_id) : undefined)

  const db = getDb()
  const newProblems = detected.filter(d => d.isNew)
  const problemRows = newProblems.length > 0
    ? db.prepare(
        `SELECT po.*, c.container_no, c.yard_slot FROM problem_orders po JOIN containers c ON po.container_id = c.id WHERE po.id IN (${newProblems.map(p => p.id).join(',')})`
      ).all()
    : []

  res.json({ success: true, data: problemRows, meta: { totalDetected: detected.length, newCount: newProblems.length } })
})

router.put('/:id/resolve', (req: AuthRequest, res: Response): void => {
  const db = getDb()
  const problem = db.prepare('SELECT * FROM problem_orders WHERE id = ?').get(req.params.id) as any
  if (!problem) {
    res.status(404).json({ success: false, error: '问题单不存在' })
    return
  }

  const now = new Date().toISOString().replace('T', ' ').slice(0, 19)
  db.prepare('UPDATE problem_orders SET status = ?, resolved_at = ?, updated_at = ? WHERE id = ?').run('resolved', now, now, req.params.id)

  const container = db.prepare('SELECT * FROM containers WHERE id = ?').get(problem.container_id) as any
  db.prepare('INSERT INTO operation_logs (user_id, username, role, action, container_no, detail) VALUES (?, ?, ?, ?, ?, ?)').run(
    req.user!.id, req.user!.username, req.user!.role, 'problem_resolve', container.container_no, `问题单已解决: ${problem.description}`
  )

  try { detectProblems(problem.container_id) } catch {}

  const updated = db.prepare('SELECT * FROM problem_orders WHERE id = ?').get(req.params.id)
  res.json({ success: true, data: updated })
})

router.put('/:id/action', (req: AuthRequest, res: Response): void => {
  const { action, data } = req.body
  if (!action) {
    res.status(400).json({ success: false, error: '缺少action字段' })
    return
  }

  const db = getDb()
  const problem = db.prepare('SELECT * FROM problem_orders WHERE id = ?').get(req.params.id) as any
  if (!problem) {
    res.status(404).json({ success: false, error: '问题单不存在' })
    return
  }

  const now = new Date().toISOString().replace('T', ' ').slice(0, 19)
  const container = db.prepare('SELECT * FROM containers WHERE id = ?').get(problem.container_id) as any

  if (action === 'reschedule') {
    if (!data?.planned_at) {
      res.status(400).json({ success: false, error: '改期操作需要提供planned_at' })
      return
    }
    if (problem.inspection_id) {
      db.prepare('UPDATE inspections SET planned_at = ? WHERE id = ?').run(data.planned_at, problem.inspection_id)
    }
    const currentActionData = JSON.parse(problem.action_data || '{}')
    currentActionData.rescheduled_at = data.planned_at
    db.prepare('UPDATE problem_orders SET status = ?, action_data = ?, updated_at = ? WHERE id = ?').run('rescheduled', JSON.stringify(currentActionData), now, req.params.id)
    db.prepare('INSERT INTO operation_logs (user_id, username, role, action, container_no, detail) VALUES (?, ?, ?, ?, ?, ?)').run(
      req.user!.id, req.user!.username, req.user!.role, 'problem_reschedule', container.container_no, `问题单改期: ${data.planned_at}`
    )
  } else if (action === 'supplement') {
    const currentActionData = JSON.parse(problem.action_data || '{}')
    Object.assign(currentActionData, data || {})
    db.prepare('UPDATE problem_orders SET status = ?, action_data = ?, updated_at = ? WHERE id = ?').run('supplemented', JSON.stringify(currentActionData), now, req.params.id)
    db.prepare('INSERT INTO operation_logs (user_id, username, role, action, container_no, detail) VALUES (?, ?, ?, ?, ?, ?)').run(
      req.user!.id, req.user!.username, req.user!.role, 'problem_supplement', container.container_no, '问题单补录数据'
    )
  } else if (action === 'reject') {
    db.prepare('UPDATE problem_orders SET status = ?, resolved_at = ?, updated_at = ? WHERE id = ?').run('rejected', now, now, req.params.id)
    db.prepare('INSERT INTO operation_logs (user_id, username, role, action, container_no, detail) VALUES (?, ?, ?, ?, ?, ?)').run(
      req.user!.id, req.user!.username, req.user!.role, 'problem_reject', container.container_no, '问题单已驳回'
    )
  } else {
    res.status(400).json({ success: false, error: '无效的action，仅支持reschedule/supplement/reject' })
    return
  }

  try { detectProblems(problem.container_id) } catch {}

  const updated = db.prepare('SELECT * FROM problem_orders WHERE id = ?').get(req.params.id)
  res.json({ success: true, data: updated })
})

export default router
