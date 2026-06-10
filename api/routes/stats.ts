import { Router, type Request, type Response } from 'express'
import { getDb, getSlaHours, STATUS_FLOW } from '../db.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  const db = getDb()
  const role = req.query.role as string

  const baseCounts: Record<string, number> = {
    pending_transfer: 0,
    transferred: 0,
    pending_assessment: 0,
    pending_approval: 0,
    culled: 0,
    retained: 0,
  }

  const rows = db.prepare('SELECT status, COUNT(*) as cnt FROM transfers GROUP BY status').all() as { status: string; cnt: number }[]
  for (const r of rows) {
    baseCounts[r.status] = r.cnt
  }

  const overduePendingTransfer = (db.prepare("SELECT COUNT(*) as cnt FROM transfers WHERE status = 'pending_transfer' AND deadline_at < datetime('now', 'localtime')").get() as { cnt: number }).cnt
  const overdueTransferred = (db.prepare("SELECT COUNT(*) as cnt FROM transfers WHERE status = 'transferred' AND deadline_at < datetime('now', 'localtime')").get() as { cnt: number }).cnt
  const overdueAssessment = (db.prepare("SELECT COUNT(*) as cnt FROM assessments WHERE status = 'pending_assessment' AND deadline_at < datetime('now', 'localtime')").get() as { cnt: number }).cnt
  const overdueApproval = (db.prepare("SELECT COUNT(*) as cnt FROM assessments WHERE status = 'pending_approval' AND deadline_at < datetime('now', 'localtime')").get() as { cnt: number }).cnt

  const result: Record<string, any> = {
    ...baseCounts,
    overduePendingTransfer,
    overdueTransferred,
    overdueAssessment,
    overdueApproval,
    totalTransfers: Object.values(baseCounts).reduce((a, b) => a + b, 0),
  }

  if (role === '繁育员') {
    result.pendingTransfer = baseCounts.pending_transfer
    result.myTransfers = baseCounts.pending_transfer + baseCounts.transferred + baseCounts.pending_assessment
    result.overdueMyTasks = overduePendingTransfer + overdueTransferred
  } else if (role === '兽医') {
    result.pendingAssessment = baseCounts.pending_assessment
    result.assessed = baseCounts.culled + baseCounts.retained + baseCounts.pending_approval
    result.overdueMyTasks = overdueAssessment
  } else if (role === '场长') {
    result.pendingApproval = baseCounts.pending_approval
    result.overdueMyTasks = overdueApproval
  }

  res.json({ success: true, data: result })
})

export default router
