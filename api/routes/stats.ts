import { Router, type Request, type Response } from 'express'
import { getDb } from '../db.js'

const router = Router()

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

export default router
