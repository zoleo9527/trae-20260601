import { Router, type Request, type Response } from 'express'
import { getDb } from '../db.js'

const router = Router()

router.get('/', (_req: Request, res: Response): void => {
  const db = getDb()

  const pendingTests = db.prepare(`SELECT COUNT(*) as count FROM joint_tests WHERE status = ?`).get('pending').count
  const failedTests = db.prepare(`SELECT COUNT(*) as count FROM joint_tests WHERE status = ?`).get('failed').count
  const pendingIssues = db.prepare(`SELECT COUNT(*) as count FROM issues WHERE status IN (?, ?)`).get('pending_assign', 'in_progress').count
  const pendingVerifyIssues = db.prepare(`SELECT COUNT(*) as count FROM issues WHERE status = ?`).get('pending_verify').count

  const recentLogs = db.prepare('SELECT * FROM operation_logs ORDER BY created_at DESC LIMIT 10').all()
  const recentActivities = recentLogs.map((log: any) => {
    let entityInfo: any = null
    if (log.entity_type === 'test') {
      const test = db.prepare('SELECT title FROM joint_tests WHERE id = ?').get(log.entity_id)
      entityInfo = test ? { type: 'test', title: test.title } : null
    } else if (log.entity_type === 'issue') {
      const issue = db.prepare('SELECT title FROM issues WHERE id = ?').get(log.entity_id)
      entityInfo = issue ? { type: 'issue', title: issue.title } : null
    }
    return { ...log, entityInfo }
  })

  res.json({ success: true, data: { pendingTests, failedTests, pendingIssues, pendingVerifyIssues, recentActivities } })
})

export default router
