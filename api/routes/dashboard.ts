import { Router, type Request, type Response } from 'express'
import db from '../db.js'

const router = Router()

router.get('/stats', (_req: Request, res: Response): void => {
  const cutoff = Math.floor(Date.now() / 1000) - 5 * 3600

  const overdueInspections = db.prepare(
    "SELECT COUNT(*) as count FROM inspections WHERE status IN ('pending', 'in_progress') AND created_at < ?"
  ).get(cutoff) as { count: number }

  const incompleteEggRecords = db.prepare(
    "SELECT COUNT(*) as count FROM egg_records WHERE status IN ('pending', 'anomaly')"
  ).get() as { count: number }

  const openAnomalies = db.prepare(
    "SELECT COUNT(*) as count FROM anomalies WHERE status IN ('open', 'assigned', 'processing')"
  ).get() as { count: number }

  res.json({
    success: true,
    data: {
      overdue_inspections: overdueInspections.count,
      incomplete_egg_records: incompleteEggRecords.count,
      open_anomalies: openAnomalies.count,
    },
  })
})

router.get('/todos', (req: Request, res: Response): void => {
  const userId = req.user?.id
  const role = req.user?.role

  if (!userId || !role) {
    res.status(401).json({ success: false, error: '未登录' })
    return
  }

  const now = Math.floor(Date.now() / 1000)
  const cutoff = now - 5 * 3600
  const todos: { id: number; type: string; title: string; coop_code: string; coop_name: string; status: string; created_at: number; inspector_name?: string; assignee_name?: string }[] = []

  if (role === 'feeder') {
    const pendingInspections = db.prepare(`
      SELECT i.id, 'inspection' as type, '待领取巡检' as title, c.code as coop_code, c.name as coop_name, i.status, i.created_at
      FROM inspections i
      LEFT JOIN coops c ON i.coop_id = c.id
      WHERE i.status = 'pending'
      ORDER BY i.created_at ASC
    `).all() as typeof todos

    const inProgressInspections = db.prepare(`
      SELECT i.id, 'inspection' as type, '巡检中' as title, c.code as coop_code, c.name as coop_name, i.status, i.created_at
      FROM inspections i
      LEFT JOIN coops c ON i.coop_id = c.id
      WHERE i.status = 'in_progress' AND i.inspector_id = ?
      ORDER BY i.created_at ASC
    `).all(userId) as typeof todos

    const assignedAnomalies = db.prepare(`
      SELECT a.id, 'anomaly' as type, '待处理异常' as title, c.code as coop_code, c.name as coop_name, a.status, a.created_at
      FROM anomalies a
      LEFT JOIN coops c ON a.coop_id = c.id
      WHERE a.assignee_id = ? AND a.status IN ('assigned', 'processing')
      ORDER BY a.created_at ASC
    `).all(userId) as typeof todos

    todos.push(...pendingInspections, ...inProgressInspections, ...assignedAnomalies)
  } else if (role === 'sorter') {
    const pendingConfirm = db.prepare(`
      SELECT i.id, 'inspection_confirm' as type, '待确认巡检' as title, c.code as coop_code, c.name as coop_name, i.status, i.created_at
      FROM inspections i
      LEFT JOIN coops c ON i.coop_id = c.id
      WHERE i.status = 'pending_confirm'
      ORDER BY i.created_at ASC
    `).all() as typeof todos

    const pendingEggRecords = db.prepare(`
      SELECT e.id, 'egg_record' as type, '待填写产蛋记录' as title, c.code as coop_code, c.name as coop_name, e.status, e.created_at
      FROM egg_records e
      LEFT JOIN coops c ON e.coop_id = c.id
      WHERE e.status = 'pending'
      ORDER BY e.created_at ASC
    `).all() as typeof todos

    todos.push(...pendingConfirm, ...pendingEggRecords)
  } else if (role === 'manager') {
    const overdueInspections = db.prepare(`
      SELECT i.id, 'inspection_overdue' as type, '超时巡检' as title, c.code as coop_code, c.name as coop_name, i.status, i.created_at,
        u.name as inspector_name
      FROM inspections i
      LEFT JOIN coops c ON i.coop_id = c.id
      LEFT JOIN users u ON i.inspector_id = u.id
      WHERE i.status IN ('pending', 'in_progress') AND i.created_at < ?
      ORDER BY i.created_at ASC
    `).all(cutoff) as typeof todos

    const openAnomalies = db.prepare(`
      SELECT a.id, 'anomaly' as type, '待处理异常' as title, c.code as coop_code, c.name as coop_name, a.status, a.created_at,
        asgn.name as assignee_name
      FROM anomalies a
      LEFT JOIN coops c ON a.coop_id = c.id
      LEFT JOIN users asgn ON a.assignee_id = asgn.id
      WHERE a.status IN ('open', 'assigned')
      ORDER BY a.created_at ASC
    `).all() as typeof todos

    todos.push(...overdueInspections, ...openAnomalies)
  }

  todos.sort((a, b) => a.created_at - b.created_at)

  res.json({ success: true, data: todos })
})

router.get('/coop-status', (_req: Request, res: Response): void => {
  const coops = db.prepare('SELECT * FROM coops ORDER BY code ASC').all() as { id: number; code: string; name: string; capacity: number; status: string }[]

  const result = coops.map((coop) => {
    const latestInspection = db.prepare(`
      SELECT i.*, u.name as inspector_name
      FROM inspections i
      LEFT JOIN users u ON i.inspector_id = u.id
      WHERE i.coop_id = ?
      ORDER BY i.created_at DESC
      LIMIT 1
    `).get(coop.id) as Record<string, unknown> | undefined

    const latestEggRecord = db.prepare(`
      SELECT e.*, u.name as sorter_name
      FROM egg_records e
      LEFT JOIN users u ON e.sorter_id = u.id
      WHERE e.coop_id = ?
      ORDER BY e.created_at DESC
      LIMIT 1
    `).get(coop.id) as Record<string, unknown> | undefined

    return {
      ...coop,
      latest_inspection: latestInspection ?? null,
      latest_egg_record: latestEggRecord ?? null,
    }
  })

  res.json({ success: true, data: result })
})

export default router
