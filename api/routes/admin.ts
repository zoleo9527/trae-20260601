import { Router, type Request, type Response } from 'express'
import db, { seedData } from '../database.js'

const router = Router()

router.post('/reset', (req: Request, res: Response) => {
  const { confirmText } = req.body
  if (confirmText !== '确认重置') {
    res.status(400).json({ success: false, error: '确认文本不匹配，请输入"确认重置"' })
    return
  }

  db.exec('DROP TABLE IF EXISTS attachments')
  db.exec('DROP TABLE IF EXISTS handover_logs')
  db.exec('DROP TABLE IF EXISTS seat_allocations')
  db.exec('DROP TABLE IF EXISTS seats')
  db.exec('DROP TABLE IF EXISTS registrations')

  seedData()
  res.json({ success: true, message: '数据已重置' })
})

router.get('/stats', (req: Request, res: Response) => {
  const now = new Date().toISOString()
  const role = req.query.role as string

  const pending = db.prepare("SELECT COUNT(*) as count FROM registrations WHERE status = 'pending'").get() as { count: number }
  const overdue = db.prepare(
    "SELECT COUNT(*) as count FROM registrations WHERE deadline_at < ? AND status NOT IN ('completed', 'rejected')"
  ).get(now) as { count: number }
  const conflictRegs = db.prepare(
    "SELECT DISTINCT registration_id FROM handover_logs WHERE note_type = 'dispute'"
  ).all() as { registration_id: string }[]
  const escalated = db.prepare("SELECT COUNT(*) as count FROM registrations WHERE status = 'escalated'").get() as { count: number }

  let myPending = 0
  if (role) {
    const myPendingResult = db.prepare(
      "SELECT COUNT(*) as count FROM registrations WHERE current_owner_role = ? AND status NOT IN ('completed', 'rejected')"
    ).get(role) as { count: number }
    myPending = myPendingResult.count
  }

  const recentLogs = db.prepare(`
    SELECT hl.*, r.event_name
    FROM handover_logs hl
    LEFT JOIN registrations r ON r.id = hl.registration_id
    ORDER BY hl.created_at DESC
    LIMIT 15
  `).all()

  res.json({
    success: true,
    data: {
      pending: pending.count,
      overdue: overdue.count,
      conflicts: conflictRegs.length,
      escalated: escalated.count,
      my_pending: myPending,
      recent_logs: recentLogs,
    },
  })
})

export default router
