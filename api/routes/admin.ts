import { Router, type Request, type Response } from 'express'
import db, { seedData, genId } from '../database.js'

const router = Router()

router.get('/reminder-feedback', (_req: Request, res: Response) => {
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const reminders = db.prepare(`
    SELECT hl.*, r.event_name, r.team_name, r.status as reg_status, r.current_owner_role, r.owner_since
    FROM handover_logs hl
    LEFT JOIN registrations r ON r.id = hl.registration_id
    WHERE hl.note_type = 'reminder'
      AND hl.created_at >= ?
    ORDER BY hl.created_at DESC
  `).all(todayStart.toISOString())

  const nowMs = Date.now()
  const enriched = reminders.map((rem: Record<string, unknown>) => {
    let responded = false
    if (rem.to_role && rem.reg_status && rem.owner_since) {
      const ownerRole = rem.current_owner_role as string
      const toRole = rem.to_role as string
      if (ownerRole === toRole) {
        const ownerSince = new Date(rem.owner_since as string).getTime()
        const remTime = new Date(rem.created_at as string).getTime()
        if (ownerSince >= remTime) {
          responded = true
        }
      }
      const logsAfter = db.prepare(
        "SELECT * FROM handover_logs WHERE registration_id = ? AND created_at > ? AND operator_role = ? AND note_type != 'reminder'"
      ).all(rem.registration_id, rem.created_at as string, toRole)
      if (logsAfter.length > 0) responded = true
    }
    return { ...rem, responded }
  })

  res.json({ success: true, data: enriched })
})

router.post('/send-reminder', (req: Request, res: Response) => {
  const { registration_id, operator_role, operator_name, to_role, note } = req.body
  if (!registration_id || !operator_role || !operator_name || !to_role) {
    res.json({ success: false, error: '缺少必填字段' })
    return
  }

  const recent = db.prepare(
    "SELECT created_at FROM handover_logs WHERE registration_id = ? AND note_type = 'reminder' AND to_role = ? ORDER BY created_at DESC LIMIT 1"
  ).get(registration_id, to_role) as { created_at: string } | undefined

  if (recent) {
    const diffMs = Date.now() - new Date(recent.created_at).getTime()
    if (diffMs < 5 * 60 * 1000) {
      res.json({ success: false, error: '5分钟内不可重复催办同一角色', cooldown_remaining: Math.ceil((5 * 60 * 1000 - diffMs) / 1000) })
      return
    }
  }

  const id = genId('log')
  const now = new Date().toISOString()
  const insertLog = db.prepare(
    "INSERT INTO handover_logs (id, registration_id, operator_role, operator_name, action, note_type, note, created_at, from_role, to_role) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  )
  const result = insertLog.run(
    id,
    registration_id,
    operator_role,
    operator_name,
    `催办 ${to_role}`,
    'reminder',
    note || `${operator_role}催办${to_role}尽快处理`,
    now,
    operator_role,
    to_role,
  )

  const log = db.prepare('SELECT * FROM handover_logs WHERE id = ?').get(id)
  res.json({ success: true, data: log })
})

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
    WHERE hl.note_type IN ('dispute', 'urgent', 'arbitration', 'reminder')
    ORDER BY hl.created_at DESC
    LIMIT 20
  `).all()
  res.json({ success: true, data: logs })
})

router.get('/role-pressure', (_req: Request, res: Response) => {
  const nowISO = new Date().toISOString()
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const roles = ['网管', '赛事运营', '店长'] as const
  const result: Record<string, { pending_count: number; avg_handover_minutes: number | null; longest_stall: { registration_id: string; event_name: string; team_name: string; stall_minutes: number } | null; today_reminder_count: number }> = {}

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

    const reminderCount = (db.prepare(
      "SELECT COUNT(*) as cnt FROM handover_logs WHERE note_type = 'reminder' AND to_role = ? AND created_at >= ?"
    ).get(role, todayStart.toISOString()) as { cnt: number }).cnt

    result[role] = {
      pending_count: pending.length,
      avg_handover_minutes: countWithOwnerSince > 0 ? Math.round(totalMinutes / countWithOwnerSince) : null,
      longest_stall: longestStall,
      today_reminder_count: reminderCount,
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
