import { Router, type Request, type Response } from 'express'
import { getDb } from '../db.js'

const router = Router()

function mapPkg(pkg: any) {
  return {
    id: pkg.id,
    trackingNo: pkg.tracking_no,
    status: pkg.status,
    type: pkg.type,
    arrivedAt: pkg.arrived_at,
    currentHandler: pkg.current_handler,
    currentRole: pkg.current_role,
    problemType: pkg.problem_type,
    problemDescription: pkg.problem_description,
  }
}

router.get('/today', (_req: Request, res: Response) => {
  const db = getDb()

  const pendingCheckin = (db.prepare("SELECT COUNT(*) as cnt FROM packages WHERE status = 'arrived'").get() as any).cnt
  const pendingVerify = (db.prepare("SELECT COUNT(*) as cnt FROM packages WHERE status IN ('checked_in', 'notified')").get() as any).cnt
  const problemCount = (db.prepare("SELECT COUNT(*) as cnt FROM packages WHERE status = 'problem'").get() as any).cnt
  const todayCompleted = (db.prepare("SELECT COUNT(*) as cnt FROM packages WHERE status IN ('verified', 'completed')").get() as any).cnt

  const now = new Date()
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 3600000).toISOString()
  const overdueCheckin = (db.prepare("SELECT COUNT(*) as cnt FROM packages WHERE status = 'arrived' AND arrived_at < ?").get(twentyFourHoursAgo) as any).cnt
  const overdueVerify = (db.prepare("SELECT COUNT(*) as cnt FROM packages WHERE status IN ('checked_in', 'notified') AND arrived_at < ?").get(twentyFourHoursAgo) as any).cnt

  res.json({
    success: true,
    data: { pendingCheckin, pendingVerify, problemCount, todayCompleted, overdueCheckin, overdueVerify },
  })
})

router.get('/priority', (req: Request, res: Response) => {
  const db = getDb()
  const limit = Math.min(parseInt(req.query.limit as string) || 10, 50)

  const now = new Date()
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 3600000).toISOString()

  const items: any[] = []

  const overdueCheckinPkgs = db.prepare(
    "SELECT * FROM packages WHERE status = 'arrived' AND arrived_at < ? ORDER BY arrived_at ASC"
  ).all(twentyFourHoursAgo) as any[]
  for (const pkg of overdueCheckinPkgs) {
    items.push({ ...mapPkg(pkg), priority: 1, reason: '超时未入库' })
  }

  const overdueVerifyPkgs = db.prepare(
    "SELECT * FROM packages WHERE status IN ('checked_in', 'notified') AND arrived_at < ? ORDER BY arrived_at ASC"
  ).all(twentyFourHoursAgo) as any[]
  for (const pkg of overdueVerifyPkgs) {
    items.push({ ...mapPkg(pkg), priority: 2, reason: '超时未核销' })
  }

  const problemPkgs = db.prepare(
    "SELECT * FROM packages WHERE status = 'problem' ORDER BY arrived_at ASC"
  ).all() as any[]
  for (const pkg of problemPkgs) {
    items.push({ ...mapPkg(pkg), priority: 3, reason: pkg.problem_type ? `问题件·${pkg.problem_type}` : '问题件待处理' })
  }

  const arrivedPkgs = db.prepare(
    "SELECT * FROM packages WHERE status = 'arrived' AND arrived_at >= ? ORDER BY arrived_at ASC"
  ).all(twentyFourHoursAgo) as any[]
  for (const pkg of arrivedPkgs) {
    items.push({ ...mapPkg(pkg), priority: 4, reason: '待入库' })
  }

  const verifyPkgs = db.prepare(
    "SELECT * FROM packages WHERE status IN ('checked_in', 'notified') AND arrived_at >= ? ORDER BY arrived_at ASC"
  ).all(twentyFourHoursAgo) as any[]
  for (const pkg of verifyPkgs) {
    items.push({ ...mapPkg(pkg), priority: 5, reason: '待核销' })
  }

  items.sort((a, b) => a.priority - b.priority || new Date(a.arrivedAt).getTime() - new Date(b.arrivedAt).getTime())

  res.json({ success: true, data: items.slice(0, limit) })
})

export default router
