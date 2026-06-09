import { Router, type Response } from 'express'
import { getDb } from '../database.js'
import { authMiddleware, type AuthRequest } from '../middleware/auth.js'
import { detectProblems } from '../detect.js'

const router = Router()

router.use(authMiddleware)

router.get('/:role', (req: AuthRequest, res: Response): void => {
  const db = getDb()
  const role = req.params.role
  const today = new Date().toISOString().slice(0, 10)
  const now = new Date()
  const nowStr = now.toISOString().replace('T', ' ').slice(0, 19)
  const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString().replace('T', ' ').slice(0, 19)

  try { detectProblems() } catch {}

  let pendingCount = 0
  let stuckOrders: any[] = []

  const todayEntered = (db.prepare("SELECT COUNT(*) as count FROM containers WHERE entered_at LIKE ?").get(`${today}%`) as any).count
  const todayExited = (db.prepare("SELECT COUNT(*) as count FROM containers WHERE exited_at LIKE ?").get(`${today}%`) as any).count
  const todayInspections = (db.prepare("SELECT COUNT(*) as count FROM inspections WHERE completed_at LIKE ?").get(`${today}%`) as any).count
  const todayMoves = (db.prepare("SELECT COUNT(*) as count FROM move_tasks WHERE completed_at LIKE ?").get(`${today}%`) as any).count

  if (role === 'gate') {
    pendingCount = (db.prepare("SELECT COUNT(*) as count FROM containers WHERE status = 'inspecting'").get() as any).count
    stuckOrders = db.prepare(
      `SELECT po.*, c.container_no, c.yard_slot, c.expected_slot FROM problem_orders po JOIN containers c ON po.container_id = c.id WHERE po.status = 'open' AND po.type IN ('overdue', 'misplaced', 'stuck_inspecting', 'expiring_soon', 'no_inspection') ORDER BY po.severity DESC, po.detected_at`
    ).all()
  } else if (role === 'dispatch') {
    pendingCount = (db.prepare("SELECT COUNT(*) as count FROM inspections WHERE status IN ('planned', 'executing')").get() as any).count
    pendingCount += (db.prepare("SELECT COUNT(*) as count FROM move_tasks WHERE status IN ('pending', 'in_progress')").get() as any).count
    stuckOrders = db.prepare(
      `SELECT po.*, c.container_no, c.yard_slot, c.expected_slot FROM problem_orders po JOIN containers c ON po.container_id = c.id WHERE po.status = 'open' ORDER BY po.severity DESC, po.detected_at`
    ).all()
  } else if (role === 'service') {
    pendingCount = (db.prepare("SELECT COUNT(*) as count FROM problem_orders WHERE status = 'open'").get() as any).count
    stuckOrders = db.prepare(
      `SELECT po.*, c.container_no, c.yard_slot, c.expected_slot FROM problem_orders po JOIN containers c ON po.container_id = c.id WHERE po.status = 'open' ORDER BY po.severity DESC, po.detected_at`
    ).all()
  }

  const recentDetections = db.prepare(
    `SELECT po.*, c.container_no, c.yard_slot FROM problem_orders po JOIN containers c ON po.container_id = c.id WHERE po.detected_at >= ? ORDER BY po.detected_at DESC`
  ).all(fortyEightHoursAgo)

  let pendingActions: any = {}

  const criticalCount = (db.prepare("SELECT COUNT(*) as count FROM problem_orders WHERE status = 'open' AND severity = 'critical'").get() as any).count
  const warningCount = (db.prepare("SELECT COUNT(*) as count FROM problem_orders WHERE status = 'open' AND severity = 'warning'").get() as any).count

  if (role === 'gate') {
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().replace('T', ' ').slice(0, 19)
    const stuckInspecting = db.prepare(
      `SELECT * FROM containers WHERE status = 'inspecting' AND entered_at < ?`
    ).all(twentyFourHoursAgo)
    pendingActions = { stuckInspecting, criticalCount, warningCount }
  } else if (role === 'dispatch') {
    const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().replace('T', ' ').slice(0, 19)
    const unnotifiedInspections = db.prepare(
      `SELECT insp.*, c.container_no, c.yard_slot FROM inspections insp JOIN containers c ON insp.container_id = c.id WHERE insp.status = 'planned' AND insp.notified_at IS NULL AND insp.planned_at < ?`
    ).all(twentyFourHoursFromNow)

    const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString().replace('T', ' ').slice(0, 19)
    const overdueMoveTasks = db.prepare(
      `SELECT mt.*, c.container_no FROM move_tasks mt JOIN containers c ON mt.container_id = c.id WHERE mt.status = 'pending' AND mt.created_at < ?`
    ).all(twelveHoursAgo)

    pendingActions = { unnotifiedInspections, overdueMoveTasks, criticalCount, warningCount }
  } else if (role === 'service') {
    const openByType = db.prepare(
      `SELECT type, COUNT(*) as count FROM problem_orders WHERE status NOT IN ('resolved', 'rejected') GROUP BY type`
    ).all()
    const byType: Record<string, number> = {}
    for (const row of openByType as any[]) {
      byType[row.type] = row.count
    }
    const openBySeverity = db.prepare(
      `SELECT severity, COUNT(*) as count FROM problem_orders WHERE status NOT IN ('resolved', 'rejected') GROUP BY severity`
    ).all()
    const bySeverity: Record<string, number> = {}
    for (const row of openBySeverity as any[]) {
      bySeverity[row.severity] = row.count
    }
    pendingActions = { openByType: byType, openBySeverity: bySeverity, criticalCount, warningCount }
  }

  const openByTypeForBreakdown = db.prepare(
    `SELECT type, COUNT(*) as count FROM problem_orders WHERE status = 'open' GROUP BY type`
  ).all() as any[]
  const typeBreakdown: Record<string, number> = {}
  for (const row of openByTypeForBreakdown) {
    typeBreakdown[row.type] = row.count
  }

  res.json({
    success: true,
    data: {
      pendingCount,
      stuckOrders,
      recentDetections,
      pendingActions,
      lastDetectedAt: nowStr,
      typeBreakdown,
      todayStats: {
        entered: todayEntered,
        exited: todayExited,
        inspections: todayInspections,
        moves: todayMoves,
      },
    },
  })
})

export default router
