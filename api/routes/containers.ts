import { Router, type Response } from 'express'
import { getDb } from '../database.js'
import { authMiddleware, type AuthRequest } from '../middleware/auth.js'
import { detectProblems } from '../detect.js'

const router = Router()

router.use(authMiddleware)

router.get('/', (req: AuthRequest, res: Response): void => {
  const db = getDb()
  const { status, search, page = '1', size = '20' } = req.query
  const pageNum = Number(page) || 1
  const sizeNum = Number(size) || 20
  const offset = (pageNum - 1) * sizeNum

  let where = '1=1'
  const params: any[] = []

  if (status) {
    where += ' AND status = ?'
    params.push(status)
  }
  if (search) {
    where += ' AND (container_no LIKE ? OR vessel LIKE ? OR yard_slot LIKE ?)'
    const keyword = `%${search}%`
    params.push(keyword, keyword, keyword)
  }

  const total = (db.prepare(`SELECT COUNT(*) as count FROM containers WHERE ${where}`).get(...params) as any).count
  const rows = db.prepare(`SELECT * FROM containers WHERE ${where} ORDER BY entered_at DESC LIMIT ? OFFSET ?`).all(...params, sizeNum, offset)

  res.json({ success: true, data: { list: rows, total, page: pageNum, size: sizeNum } })
})

router.get('/:id', (req: AuthRequest, res: Response): void => {
  const db = getDb()
  const container = db.prepare('SELECT * FROM containers WHERE id = ?').get(req.params.id) as any
  if (!container) {
    res.status(404).json({ success: false, error: '集装箱不存在' })
    return
  }

  const inspections = db.prepare('SELECT * FROM inspections WHERE container_id = ? ORDER BY planned_at').all(container.id)
  const moveTasks = db.prepare('SELECT * FROM move_tasks WHERE container_id = ? ORDER BY created_at').all(container.id)
  const problems = db.prepare('SELECT * FROM problem_orders WHERE container_id = ? ORDER BY detected_at').all(container.id)
  const logs = db.prepare('SELECT * FROM operation_logs WHERE container_no = ? ORDER BY created_at DESC').all(container.container_no)

  const timeline: any[] = []
  timeline.push({ type: 'enter', time: container.entered_at, detail: `集装箱进场，堆位: ${container.yard_slot}` })
  for (const insp of inspections as any[]) {
    timeline.push({ type: 'inspection', time: insp.planned_at, detail: `查验计划: ${insp.type}`, data: insp })
    if (insp.completed_at) {
      timeline.push({ type: 'inspection_done', time: insp.completed_at, detail: `查验完成: ${insp.result}`, data: insp })
    }
  }
  for (const mt of moveTasks as any[]) {
    timeline.push({ type: 'move', time: mt.created_at, detail: `移箱任务: ${mt.from_slot} → ${mt.to_slot}`, data: mt })
    if (mt.completed_at) {
      timeline.push({ type: 'move_done', time: mt.completed_at, detail: `移箱完成`, data: mt })
    }
  }
  for (const prob of problems as any[]) {
    timeline.push({ type: 'problem', time: prob.detected_at, detail: `问题单: ${prob.description}`, data: prob })
  }
  timeline.sort((a, b) => a.time.localeCompare(b.time))

  res.json({ success: true, data: { container, inspections, moveTasks, problems, timeline } })
})

router.post('/', (req: AuthRequest, res: Response): void => {
  const body = req.body
  const container_no = body.container_no || body.containerNo
  const vessel = body.vessel
  const voyage = body.voyage
  const target_port = body.target_port || body.targetPort
  const yard_slot = body.yard_slot || body.yardSlot
  const free_storage_until = body.free_storage_until || body.freeStorageUntil

  if (!container_no || !vessel || !voyage || !target_port) {
    res.status(400).json({ success: false, error: '缺少必填字段' })
    return
  }

  const db = getDb()
  const existing = db.prepare('SELECT id FROM containers WHERE container_no = ?').get(container_no)
  if (existing) {
    res.status(409).json({ success: false, error: '集装箱号已存在' })
    return
  }

  const now = new Date().toISOString().replace('T', ' ').slice(0, 19)
  const result = db.prepare(
    `INSERT INTO containers (container_no, vessel, voyage, target_port, yard_slot, expected_slot, status, entered_at, free_storage_until) VALUES (?, ?, ?, ?, ?, ?, 'inspecting', ?, ?)`
  ).run(container_no, vessel, voyage, target_port, yard_slot || null, yard_slot || null, now, free_storage_until || null)

  db.prepare('INSERT INTO operation_logs (user_id, username, role, action, container_no, detail) VALUES (?, ?, ?, ?, ?, ?)').run(
    req.user!.id, req.user!.username, req.user!.role, 'container_enter', container_no, `闸口登记: ${container_no}`
  )

  const container = db.prepare('SELECT * FROM containers WHERE id = ?').get(result.lastInsertRowid)
  try { detectProblems(Number(result.lastInsertRowid)) } catch {}
  res.status(201).json({ success: true, data: container })
})

router.put('/:id/status', (req: AuthRequest, res: Response): void => {
  const { status } = req.body
  if (!status) {
    res.status(400).json({ success: false, error: '缺少status字段' })
    return
  }

  const db = getDb()
  const container = db.prepare('SELECT * FROM containers WHERE id = ?').get(req.params.id) as any
  if (!container) {
    res.status(404).json({ success: false, error: '集装箱不存在' })
    return
  }

  const updates: string[] = ['status = ?']
  const params: any[] = [status]

  if (status === 'exited') {
    updates.push('exited_at = ?')
    params.push(new Date().toISOString().replace('T', ' ').slice(0, 19))
  }

  params.push(req.params.id)
  db.prepare(`UPDATE containers SET ${updates.join(', ')} WHERE id = ?`).run(...params)

  db.prepare('INSERT INTO operation_logs (user_id, username, role, action, container_no, detail) VALUES (?, ?, ?, ?, ?, ?)').run(
    req.user!.id, req.user!.username, req.user!.role, 'container_status_change', container.container_no, `状态变更: ${container.status} → ${status}`
  )

  const updated = db.prepare('SELECT * FROM containers WHERE id = ?').get(req.params.id)
  try { detectProblems(Number(req.params.id)) } catch {}
  res.json({ success: true, data: updated })
})

export default router
