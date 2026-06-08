import { Router, type Request, type Response } from 'express'
import db, { genId } from '../database.js'

const router = Router()

function enrichRegistration(reg: Record<string, unknown>) {
  const logs = db.prepare('SELECT * FROM handover_logs WHERE registration_id = ? ORDER BY created_at ASC').all(reg.id)
  const attachments = db.prepare('SELECT * FROM attachments WHERE registration_id = ? ORDER BY file_name ASC').all(reg.id)
  const allocation = db.prepare('SELECT * FROM seat_allocations WHERE registration_id = ? ORDER BY allocated_at DESC LIMIT 1').get(reg.id) as Record<string, unknown> | undefined

  const availableSeats = db.prepare("SELECT COUNT(*) as cnt FROM seats WHERE status = 'available'").get() as { cnt: number }
  const byZone = db.prepare("SELECT zone, COUNT(*) as cnt FROM seats WHERE status = 'available' GROUP BY zone").all() as { zone: string; cnt: number }[]
  const zoneMap: Record<string, number> = {}
  for (const row of byZone) {
    zoneMap[row.zone] = row.cnt
  }

  const needed = (reg.player_count as number) || 0

  return {
    ...reg,
    handover_logs: logs,
    attachments,
    seat_allocation: allocation || null,
    available_seats: {
      total_available: availableSeats.cnt,
      by_zone: zoneMap,
      total_needed: needed,
      gap: Math.max(0, needed - availableSeats.cnt),
    },
  }
}

router.get('/', (_req: Request, res: Response) => {
  const registrations = db.prepare('SELECT * FROM registrations ORDER BY submitted_at DESC').all()
  const result = registrations.map(enrichRegistration)
  res.json({ success: true, data: result })
})

router.post('/batch/escalate', (req: Request, res: Response) => {
  const { ids, operator_role, operator_name, reason } = req.body
  if (!Array.isArray(ids) || ids.length === 0 || !operator_role || !operator_name || !reason) {
    res.status(400).json({ success: false, error: 'ids (non-empty array), operator_role, operator_name, and reason are required' })
    return
  }

  const nowISO = new Date().toISOString()
  let processed = 0
  let skipped = 0

  const transaction = db.transaction(() => {
    const findReg = db.prepare('SELECT * FROM registrations WHERE id = ?')
    const updateReg = db.prepare("UPDATE registrations SET status = 'escalated', current_owner_role = '店长', owner_since = ?, sla_minutes = 10 WHERE id = ?")
    const insertLog = db.prepare(`
      INSERT INTO handover_logs (id, registration_id, operator_role, operator_name, action, note_type, note, created_at, from_role, to_role)
      VALUES (?, ?, ?, ?, '批量升级处理', 'urgent', ?, ?, ?, '店长')
    `)

    for (const id of ids) {
      const reg = findReg.get(id) as Record<string, unknown> | undefined
      if (!reg || reg.status === 'completed' || reg.status === 'rejected') {
        skipped++
        continue
      }
      updateReg.run(nowISO, id)
      insertLog.run(genId('log'), id, operator_role, operator_name, reason, nowISO, operator_role)
      processed++
    }
  })

  transaction()

  res.json({ success: true, data: { processed, skipped } })
})

router.post('/batch/notes', (req: Request, res: Response) => {
  const { ids, operator_role, operator_name, note_type, note } = req.body
  if (!Array.isArray(ids) || ids.length === 0 || !operator_role || !operator_name || !note) {
    res.status(400).json({ success: false, error: 'ids (non-empty array), operator_role, operator_name, and note are required' })
    return
  }

  const nowISO = new Date().toISOString()
  let processed = 0
  let skipped = 0

  const transaction = db.transaction(() => {
    const findReg = db.prepare('SELECT id FROM registrations WHERE id = ?')
    const insertLog = db.prepare(`
      INSERT INTO handover_logs (id, registration_id, operator_role, operator_name, action, note_type, note, created_at, from_role, to_role)
      VALUES (?, ?, ?, ?, '批量添加备注', ?, ?, ?, NULL, NULL)
    `)

    for (const id of ids) {
      const reg = findReg.get(id) as { id: string } | undefined
      if (!reg) {
        skipped++
        continue
      }
      insertLog.run(genId('log'), id, operator_role, operator_name, note_type || 'normal', note, nowISO)
      processed++
    }
  })

  transaction()

  res.json({ success: true, data: { processed, skipped } })
})

router.post('/batch/release-seats', (req: Request, res: Response) => {
  const { ids, operator_role, operator_name, note } = req.body
  if (!Array.isArray(ids) || ids.length === 0 || !operator_role || !operator_name || !note) {
    res.status(400).json({ success: false, error: 'ids (non-empty array), operator_role, operator_name, and note are required' })
    return
  }

  const nowISO = new Date().toISOString()
  let processed = 0
  let skipped = 0

  const transaction = db.transaction(() => {
    const findAllocation = db.prepare("SELECT * FROM seat_allocations WHERE registration_id = ? AND status = 'pending' ORDER BY allocated_at DESC LIMIT 1")
    const updateAllocation = db.prepare("UPDATE seat_allocations SET status = 'released' WHERE id = ?")
    const updateSeat = db.prepare("UPDATE seats SET status = 'available', current_registration_id = NULL WHERE id = ?")
    const updateReg = db.prepare("UPDATE registrations SET status = 'confirmed', current_owner_role = '网管', owner_since = ?, sla_minutes = 15 WHERE id = ?")
    const insertLog = db.prepare(`
      INSERT INTO handover_logs (id, registration_id, operator_role, operator_name, action, note_type, note, created_at, from_role, to_role)
      VALUES (?, ?, ?, ?, '批量释放座位', 'dispute', ?, ?, ?, '网管')
    `)

    for (const id of ids) {
      const allocation = findAllocation.get(id) as Record<string, unknown> | undefined
      if (!allocation) {
        skipped++
        continue
      }

      updateAllocation.run(allocation.id as string)

      const seatIds = (allocation.seat_ids as string).split(',')
      for (const seatId of seatIds) {
        updateSeat.run(seatId)
      }

      updateReg.run(nowISO, id)
      insertLog.run(genId('log'), id, operator_role, operator_name, note, nowISO, operator_role)
      processed++
    }
  })

  transaction()

  res.json({ success: true, data: { processed, skipped } })
})

router.get('/:id', (req: Request, res: Response) => {
  const reg = db.prepare('SELECT * FROM registrations WHERE id = ?').get(req.params.id)
  if (!reg) {
    res.status(404).json({ success: false, error: 'Registration not found' })
    return
  }
  res.json({ success: true, data: enrichRegistration(reg) })
})

router.post('/', (req: Request, res: Response) => {
  const { event_name, team_name, player_count, device_requirement, submitted_by, note, sla_minutes } = req.body
  if (!event_name || !submitted_by) {
    res.status(400).json({ success: false, error: 'event_name and submitted_by are required' })
    return
  }

  const now = new Date()
  const nowISO = now.toISOString()
  const deadline_at = new Date(now.getTime() + 30 * 60 * 1000).toISOString()
  const id = genId('REG')

  const [operatorRole, operatorName] = submitted_by.includes('/') ? submitted_by.split('/') : ['未知', submitted_by]
  const sla = sla_minutes || 15

  const transaction = db.transaction(() => {
    db.prepare(`
      INSERT INTO registrations (id, event_name, team_name, player_count, device_requirement, status, submitted_by, confirmed_by, submitted_at, confirmed_at, deadline_at, current_owner_role, owner_since, sla_minutes)
      VALUES (?, ?, ?, ?, ?, 'pending', ?, NULL, ?, NULL, ?, '赛事运营', ?, ?)
    `).run(id, event_name, team_name || '', player_count || 0, device_requirement || '', submitted_by, nowISO, deadline_at, nowISO, sla)

    db.prepare(`
      INSERT INTO handover_logs (id, registration_id, operator_role, operator_name, action, note_type, note, created_at, from_role, to_role)
      VALUES (?, ?, ?, ?, '提交报名', 'normal', ?, ?, NULL, '赛事运营')
    `).run(genId('log'), id, operatorRole, operatorName, note || '', nowISO)
  })

  transaction()

  const reg = db.prepare('SELECT * FROM registrations WHERE id = ?').get(id)
  res.status(201).json({ success: true, data: enrichRegistration(reg) })
})

router.patch('/:id', (req: Request, res: Response) => {
  const { status, operator_role, operator_name, note_type, note, conflict_acknowledged } = req.body
  if (!status || !operator_role || !operator_name) {
    res.status(400).json({ success: false, error: 'status, operator_role, and operator_name are required' })
    return
  }

  const reg = db.prepare('SELECT * FROM registrations WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined
  if (!reg) {
    res.status(404).json({ success: false, error: 'Registration not found' })
    return
  }

  const validStatuses = ['confirmed', 'rejected', 'escalated', 'completed', 'seating']
  if (!validStatuses.includes(status)) {
    res.status(400).json({ success: false, error: `Invalid status` })
    return
  }

  if (status === 'confirmed' && reg.current_owner_role !== operator_role && operator_role !== '店长') {
    res.status(403).json({ success: false, error: `当前责任方为${reg.current_owner_role}，您无权操作` })
    return
  }

  const availableSeats = db.prepare("SELECT COUNT(*) as cnt FROM seats WHERE status = 'available'").get() as { cnt: number }
  const needed = (reg.player_count as number) || 0
  const hasShortage = availableSeats.cnt < needed

  if (status === 'confirmed' && hasShortage && !conflict_acknowledged) {
    res.status(409).json({
      success: false,
      error: '座席不足',
      data: { available: availableSeats.cnt, needed, gap: needed - availableSeats.cnt },
    })
    return
  }

  const nowISO = new Date().toISOString()
  const actionMap: Record<string, string> = {
    confirmed: '确认报名',
    rejected: '驳回报名',
    escalated: '升级处理',
    completed: '终审通过',
    seating: '分配座位',
  }

  const ownerMap: Record<string, { role: string; sla: number }> = {
    confirmed: { role: '网管', sla: 15 },
    seating: { role: '店长', sla: 10 },
    escalated: { role: '店长', sla: 10 },
  }

  const operator = `${operator_role}/${operator_name}`
  const newOwner = ownerMap[status]
  const effectiveNoteType = note_type || (status === 'rejected' ? 'dispute' : status === 'escalated' ? 'urgent' : 'normal')

  const transaction = db.transaction(() => {
    const confirmedBy = ['confirmed', 'completed'].includes(status) ? operator : null
    const confirmedAt = ['confirmed', 'completed'].includes(status) ? nowISO : null

    if (newOwner) {
      db.prepare(`
        UPDATE registrations SET status = ?, confirmed_by = COALESCE(?, confirmed_by), confirmed_at = COALESCE(?, confirmed_at), current_owner_role = ?, owner_since = ?, sla_minutes = ? WHERE id = ?
      `).run(status, confirmedBy, confirmedAt, newOwner.role, nowISO, newOwner.sla, req.params.id)
    } else {
      db.prepare(`
        UPDATE registrations SET status = ?, confirmed_by = COALESCE(?, confirmed_by), confirmed_at = COALESCE(?, confirmed_at) WHERE id = ?
      `).run(status, confirmedBy, confirmedAt, req.params.id)
    }

    let effectiveNote = note || `${operator} 执行了 ${actionMap[status] || status} 操作`
    if (status === 'confirmed' && hasShortage && conflict_acknowledged) {
      effectiveNote += ` [已确认座席不足：可用${availableSeats.cnt}台/需${needed}台]`
    }

    db.prepare(`
      INSERT INTO handover_logs (id, registration_id, operator_role, operator_name, action, note_type, note, created_at, from_role, to_role)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(genId('log'), req.params.id, operator_role, operator_name, actionMap[status] || status, effectiveNoteType, effectiveNote, nowISO, operator_role, newOwner?.role || null)
  })

  transaction()

  const updated = db.prepare('SELECT * FROM registrations WHERE id = ?').get(req.params.id)
  res.json({ success: true, data: enrichRegistration(updated) })
})

router.post('/:id/notes', (req: Request, res: Response) => {
  const { operator_role, operator_name, note_type, note } = req.body
  if (!operator_role || !operator_name || !note) {
    res.status(400).json({ success: false, error: 'operator_role, operator_name, and note are required' })
    return
  }

  const reg = db.prepare('SELECT * FROM registrations WHERE id = ?').get(req.params.id)
  if (!reg) {
    res.status(404).json({ success: false, error: 'Registration not found' })
    return
  }

  const nowISO = new Date().toISOString()
  db.prepare(`
    INSERT INTO handover_logs (id, registration_id, operator_role, operator_name, action, note_type, note, created_at, from_role, to_role)
    VALUES (?, ?, ?, ?, '添加备注', ?, ?, ?, NULL, NULL)
  `).run(genId('log'), req.params.id, operator_role, operator_name, note_type || 'normal', note, nowISO)

  const logs = db.prepare('SELECT * FROM handover_logs WHERE registration_id = ? ORDER BY created_at ASC').all(req.params.id)
  res.status(201).json({ success: true, data: logs })
})

router.post('/:id/escalate', (req: Request, res: Response) => {
  const { operator_role, operator_name, reason } = req.body
  if (!operator_role || !operator_name || !reason) {
    res.status(400).json({ success: false, error: 'operator_role, operator_name, and reason are required' })
    return
  }

  const reg = db.prepare('SELECT * FROM registrations WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined
  if (!reg) {
    res.status(404).json({ success: false, error: 'Registration not found' })
    return
  }

  if (reg.status === 'completed' || reg.status === 'rejected') {
    res.status(400).json({ success: false, error: '已结束的报名无法升级' })
    return
  }

  const nowISO = new Date().toISOString()

  const transaction = db.transaction(() => {
    db.prepare(`
      UPDATE registrations SET status = 'escalated', current_owner_role = '店长', owner_since = ?, sla_minutes = 10 WHERE id = ?
    `).run(nowISO, req.params.id)

    db.prepare(`
      INSERT INTO handover_logs (id, registration_id, operator_role, operator_name, action, note_type, note, created_at, from_role, to_role)
      VALUES (?, ?, ?, ?, '升级处理', 'urgent', ?, ?, ?, '店长')
    `).run(genId('log'), req.params.id, operator_role, operator_name, reason, nowISO, operator_role)
  })

  transaction()

  const updated = db.prepare('SELECT * FROM registrations WHERE id = ?').get(req.params.id)
  res.json({ success: true, data: enrichRegistration(updated) })
})

export default router
