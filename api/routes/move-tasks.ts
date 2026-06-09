import { Router, type Response } from 'express'
import { getDb } from '../database.js'
import { detectProblems } from '../detect.js'
import { authMiddleware, type AuthRequest } from '../middleware/auth.js'

const router = Router()

router.use(authMiddleware)

router.get('/', (req: AuthRequest, res: Response): void => {
  const db = getDb()
  const { status, container_id, source_inspection_id } = req.query

  let where = '1=1'
  const params: any[] = []

  if (status) {
    where += ' AND mt.status = ?'
    params.push(status)
  }
  if (container_id) {
    where += ' AND mt.container_id = ?'
    params.push(container_id)
  }
  if (source_inspection_id) {
    where += ' AND mt.source_inspection_id = ?'
    params.push(source_inspection_id)
  }

  const rows = db.prepare(
    `SELECT mt.*, c.container_no FROM move_tasks mt JOIN containers c ON mt.container_id = c.id WHERE ${where} ORDER BY mt.created_at DESC`
  ).all(...params)

  res.json({ success: true, data: rows })
})

router.post('/', (req: AuthRequest, res: Response): void => {
  const { container_id, from_slot, to_slot, reason, source_inspection_id } = req.body
  if (!container_id || !from_slot || !to_slot) {
    res.status(400).json({ success: false, error: '缺少必填字段' })
    return
  }

  const db = getDb()
  const container = db.prepare('SELECT * FROM containers WHERE id = ?').get(container_id) as any
  if (!container) {
    res.status(404).json({ success: false, error: '集装箱不存在' })
    return
  }

  const now = new Date().toISOString().replace('T', ' ').slice(0, 19)
  const result = db.prepare(
    `INSERT INTO move_tasks (container_id, source_inspection_id, from_slot, to_slot, reason, status, created_at) VALUES (?, ?, ?, ?, ?, 'pending', ?)`
  ).run(container_id, source_inspection_id || null, from_slot, to_slot, reason || null, now)

  db.prepare('INSERT INTO operation_logs (user_id, username, role, action, container_no, detail) VALUES (?, ?, ?, ?, ?, ?)').run(
    req.user!.id, req.user!.username, req.user!.role, 'move_task_create', container.container_no, `创建移箱任务: ${from_slot} → ${to_slot}`
  )

  const task = db.prepare('SELECT * FROM move_tasks WHERE id = ?').get(result.lastInsertRowid)
  res.status(201).json({ success: true, data: task })
})

router.put('/:id/execute', (req: AuthRequest, res: Response): void => {
  const { action } = req.body
  if (!action) {
    res.status(400).json({ success: false, error: '缺少action字段' })
    return
  }

  const db = getDb()
  const task = db.prepare('SELECT * FROM move_tasks WHERE id = ?').get(req.params.id) as any
  if (!task) {
    res.status(404).json({ success: false, error: '移箱任务不存在' })
    return
  }

  const now = new Date().toISOString().replace('T', ' ').slice(0, 19)
  const container = db.prepare('SELECT * FROM containers WHERE id = ?').get(task.container_id) as any

  if (action === 'start') {
    if (task.status !== 'pending') {
      res.status(400).json({ success: false, error: '当前状态不允许开始' })
      return
    }
    db.prepare('UPDATE move_tasks SET status = ?, started_at = ? WHERE id = ?').run('in_progress', now, req.params.id)
    db.prepare('INSERT INTO operation_logs (user_id, username, role, action, container_no, detail) VALUES (?, ?, ?, ?, ?, ?)').run(
      req.user!.id, req.user!.username, req.user!.role, 'move_task_start', container.container_no, `开始移箱: ${task.from_slot} → ${task.to_slot}`
    )
  } else if (action === 'complete') {
    if (task.status !== 'in_progress') {
      res.status(400).json({ success: false, error: '当前状态不允许完成' })
      return
    }
    db.prepare('UPDATE move_tasks SET status = ?, completed_at = ? WHERE id = ?').run('completed', now, req.params.id)
    db.prepare('UPDATE containers SET yard_slot = ? WHERE id = ?').run(task.to_slot, task.container_id)
    if (container.status === 'inspection_done') {
      db.prepare('UPDATE containers SET status = ? WHERE id = ?').run('yarded', task.container_id)
    }
    db.prepare('INSERT INTO operation_logs (user_id, username, role, action, container_no, detail) VALUES (?, ?, ?, ?, ?, ?)').run(
      req.user!.id, req.user!.username, req.user!.role, 'move_task_complete', container.container_no, `移箱完成: ${task.from_slot} → ${task.to_slot}`
    )
  } else {
    res.status(400).json({ success: false, error: '无效的action，仅支持start/complete' })
    return
  }

  try { detectProblems(task.container_id) } catch {}

  const updated = db.prepare('SELECT * FROM move_tasks WHERE id = ?').get(req.params.id)
  res.json({ success: true, data: updated })
})

router.get('/:id/history', (req: AuthRequest, res: Response): void => {
  const db = getDb()
  const task = db.prepare('SELECT * FROM move_tasks WHERE id = ?').get(req.params.id) as any
  if (!task) {
    res.status(404).json({ success: false, error: '移箱任务不存在' })
    return
  }

  const container = db.prepare('SELECT * FROM containers WHERE id = ?').get(task.container_id) as any
  const logs = db.prepare(
    `SELECT * FROM operation_logs WHERE container_no = ? AND action LIKE 'move_task%' ORDER BY created_at DESC`
  ).all(container.container_no)

  res.json({ success: true, data: { task, logs } })
})

export default router
