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

router.get('/alert-timeline', (_req: Request, res: Response) => {
  const logs = db.prepare(`
    SELECT hl.*, r.event_name, r.team_name, r.status as reg_status
    FROM handover_logs hl
    LEFT JOIN registrations r ON r.id = hl.registration_id
    WHERE hl.note_type IN ('dispute', 'urgent', 'arbitration')
    ORDER BY hl.created_at DESC
    LIMIT 20
  `).all()
  res.json({ success: true, data: logs })
})

router.get('/role-pressure', (_req: Request, res: Response) => {
  const nowISO = new Date().toISOString()
  const roles = ['网管', '赛事运营', '店长'] as const
  const result: Record<string, { pending_count: number; avg_handover_minutes: number | null; longest_stall: { registration_id: string; event_name: string; team_name: string; stall_minutes: number } | null }> = {}

  for (const role of roles) {
    const pending = db.prepare(
      "SELECT * FROM registrations WHERE current_owner_role = ? AND status NOT IN ('completed', 'rejected')"
    ).all(role) as (Record<string, unknown> & { id: string; event_name: string; team_name: string; owner_since: string; sla_minutes: number })[]

    let totalMinutes = 0
    let countWithOwnerSince = 0
    let longestStall: { registration_id: string; event_name: string; team_name: string; stall_minutes: number } | null = null

    for (const reg of pending) {
      if (reg.owner_since) {
        const stallMs = new Date(nowISO).getTime() - new Date(reg.owner_since).getTime()
        const stallMin = Math.round(stallMs / 60000)
        totalMinutes += stallMin
        countWithOwnerSince++
        if (!longestStall || stallMin > longestStall.stall_minutes) {
          longestStall = {
            registration_id: reg.id,
            event_name: reg.event_name,
            team_name: reg.team_name,
            stall_minutes: stallMin,
          }
        }
      }
    }

    result[role] = {
      pending_count: pending.length,
      avg_handover_minutes: countWithOwnerSince > 0 ? Math.round(totalMinutes / countWithOwnerSince) : null,
      longest_stall: longestStall,
    }
  }

  res.json({ success: true, data: result })
})

router.get('/overdue-top', (_req: Request, res: Response) => {
  const nowISO = new Date().toISOString()
  const overdue = db.prepare(`
    SELECT r.*,
      (julianday(?) - julianday(r.owner_since)) * 24 * 60 as overdue_minutes
    FROM registrations r
    WHERE r.owner_since IS NOT NULL
      AND r.status NOT IN ('completed', 'rejected')
      AND datetime(r.owner_since, '+' || r.sla_minutes || ' minutes') < ?
    ORDER BY overdue_minutes DESC
    LIMIT 5
  `).all(nowISO, nowISO)

  const enriched = overdue.map((reg: Record<string, unknown>) => {
    const regId = reg.id as string
    const allocs = db.prepare('SELECT * FROM seat_allocations WHERE registration_id = ? AND status = ?').all(regId, 'pending')
    return { ...reg, pending_allocations: allocs.length }
  })

  res.json({ success: true, data: enriched })
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
