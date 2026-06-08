import { Router, type Request, type Response } from 'express'
import db, { genId } from '../database.js'

const router = Router()

function enrichRegistration(reg: Record<string, unknown>) {
  const logs = db.prepare('SELECT * FROM handover_logs WHERE registration_id = ? ORDER BY created_at ASC').all(reg.id)
  const attachments = db.prepare('SELECT * FROM attachments WHERE registration_id = ? ORDER BY file_name ASC').all(reg.id)
  const allAllocations = db.prepare('SELECT * FROM seat_allocations WHERE registration_id = ? ORDER BY allocated_at DESC').all(reg.id) as Record<string, unknown>[]
  const allocation = allAllocations.length > 0 ? allAllocations[0] : undefined

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
    all_allocations: allAllocations,
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

router.get('/siblings/:eventName', (req: Request, res: Response) => {
  const eventName = decodeURIComponent(req.params.eventName)
  const registrations = db.prepare('SELECT * FROM registrations WHERE event_name = ? ORDER BY submitted_at DESC').all(eventName) as Record<string, unknown>[]

  const grouped: Record<string, Record<string, unknown>[]> = {}
  const enriched = registrations.map(enrichRegistration)
  for (const reg of enriched) {
    const status = (reg as Record<string, unknown>).status as string
    if (!grouped[status]) grouped[status] = []
    grouped[status].push(reg)
  }

  res.json({ success: true, data: { event_name: eventName, total: enriched.length, by_status: grouped, registrations: enriched } })
})

router.post('/:id/arbitrate', (req: Request, res: Response) => {
  const { action, operator_role, operator_name, note, seat_ids } = req.body
  if (!action || !operator_role || !operator_name || !note) {
    res.status(400).json({ success: false, error: 'action, operator_role, operator_name, and note are required' })
    return
  }

  const validActions = ['confirm_ownership', 'reassign_seats', 'revoke_allocation', 'record_ruling']
  if (!validActions.includes(action)) {
    res.status(400).json({ success: false, error: `Invalid action. Must be one of: ${validActions.join(', ')}` })
    return
  }

  const reg = db.prepare('SELECT * FROM registrations WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined
  if (!reg) {
    res.status(404).json({ success: false, error: 'Registration not found' })
    return
  }

  const nowISO = new Date().toISOString()

  const transaction = db.transaction(() => {
    const insertLog = db.prepare(`
      INSERT INTO handover_logs (id, registration_id, operator_role, operator_name, action, note_type, note, created_at, from_role, to_role)
      VALUES (?, ?, ?, ?, '店长仲裁', 'arbitration', ?, ?, ?, ?)
    `)

    if (action === 'confirm_ownership') {
      db.prepare("UPDATE registrations SET status = 'confirmed', current_owner_role = ?, owner_since = ? WHERE id = ?")
        .run(operator_role, nowISO, req.params.id)
      insertLog.run(genId('log'), req.params.id, operator_role, operator_name, note, nowISO, operator_role, operator_role)
    }

    if (action === 'reassign_seats') {
      if (!seat_ids || !Array.isArray(seat_ids) || seat_ids.length === 0) {
        throw new Error('seat_ids (non-empty array) is required for reassign_seats')
      }

      const currentAlloc = db.prepare("SELECT * FROM seat_allocations WHERE registration_id = ? AND status = 'pending' ORDER BY allocated_at DESC LIMIT 1")
        .get(req.params.id) as Record<string, unknown> | undefined

      if (currentAlloc) {
        db.prepare("UPDATE seat_allocations SET status = 'released' WHERE id = ?").run(currentAlloc.id as string)
        const oldSeatIds = (currentAlloc.seat_ids as string).split(',')
        const updateSeat = db.prepare("UPDATE seats SET status = 'available', current_registration_id = NULL WHERE id = ?")
        for (const sid of oldSeatIds) {
          updateSeat.run(sid)
        }
      }

      const allocId = genId('alloc')
      const seatIdsStr = seat_ids.join(',')
      db.prepare(`
        INSERT INTO seat_allocations (id, registration_id, seat_ids, allocated_by, confirmed_by, allocated_at, confirmed_at, status, conflict_reason)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', NULL)
      `).run(allocId, req.params.id, seatIdsStr, `${operator_role}/${operator_name}`, null, nowISO, null)

      const updateSeatOccupied = db.prepare("UPDATE seats SET status = 'occupied', current_registration_id = ? WHERE id = ?")
      for (const sid of seat_ids) {
        updateSeatOccupied.run(req.params.id, sid)
      }

      db.prepare("UPDATE registrations SET status = 'seating', current_owner_role = '店长', owner_since = ? WHERE id = ?")
        .run(nowISO, req.params.id)

      insertLog.run(genId('log'), req.params.id, operator_role, operator_name, note, nowISO, operator_role, '店长')
    }

    if (action === 'revoke_allocation') {
      const currentAlloc = db.prepare("SELECT * FROM seat_allocations WHERE registration_id = ? AND status = 'pending' ORDER BY allocated_at DESC LIMIT 1")
        .get(req.params.id) as Record<string, unknown> | undefined

      if (currentAlloc) {
        db.prepare("UPDATE seat_allocations SET status = 'released' WHERE id = ?").run(currentAlloc.id as string)
        const oldSeatIds = (currentAlloc.seat_ids as string).split(',')
        const updateSeat = db.prepare("UPDATE seats SET status = 'available', current_registration_id = NULL WHERE id = ?")
        for (const sid of oldSeatIds) {
          updateSeat.run(sid)
        }
      }

      db.prepare("UPDATE registrations SET status = 'confirmed', current_owner_role = '网管', owner_since = ? WHERE id = ?")
        .run(nowISO, req.params.id)

      insertLog.run(genId('log'), req.params.id, operator_role, operator_name, note, nowISO, operator_role, '网管')
    }

    if (action === 'record_ruling') {
      insertLog.run(genId('log'), req.params.id, operator_role, operator_name, note, nowISO, null, null)
    }
  })

  try {
    transaction()
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Arbitration failed'
    res.status(400).json({ success: false, error: msg })
    return
  }

  const updated = db.prepare('SELECT * FROM registrations WHERE id = ?').get(req.params.id)
  res.json({ success: true, data: enrichRegistration(updated) })
})

router.get('/:id/allocation-timeline', (req: Request, res: Response) => {
  const reg = db.prepare('SELECT * FROM registrations WHERE id = ?').get(req.params.id)
  if (!reg) {
    res.status(404).json({ success: false, error: 'Registration not found' })
    return
  }

  const allocations = db.prepare('SELECT * FROM seat_allocations WHERE registration_id = ? ORDER BY allocated_at DESC').all(req.params.id) as Record<string, unknown>[]

  const seatActions = ['分配座位', '确认座位分配', '释放座位分配', '批量释放座位']
  const placeholders = seatActions.map(() => '?').join(',')
  const logs = db.prepare(
    `SELECT * FROM handover_logs WHERE registration_id = ? AND action IN (${placeholders}) ORDER BY created_at DESC`
  ).all(req.params.id, ...seatActions) as Record<string, unknown>[]

  const timeline = [
    ...allocations.map(a => ({ type: 'allocation' as const, data: a, sort_key: a.allocated_at as string })),
    ...logs.map(l => ({ type: 'log' as const, data: l, sort_key: l.created_at as string })),
  ].sort((a, b) => b.sort_key.localeCompare(a.sort_key))

  res.json({ success: true, data: timeline })
})

router.post('/:id/attachments', (req: Request, res: Response) => {
  const { file_name, file_size, category, description } = req.body
  if (!file_name || !file_size || !category) {
    res.status(400).json({ success: false, error: 'file_name, file_size, and category are required' })
    return
  }

  const validCategories = ['现场照片', '聊天记录']
  if (!validCategories.includes(category)) {
    res.status(400).json({ success: false, error: `Invalid category. Must be one of: ${validCategories.join(', ')}` })
    return
  }

  const reg = db.prepare('SELECT * FROM registrations WHERE id = ?').get(req.params.id)
  if (!reg) {
    res.status(404).json({ success: false, error: 'Registration not found' })
    return
  }

  const id = genId('att')
  db.prepare(`
    INSERT INTO attachments (id, registration_id, file_name, file_size, description, category, status, uploaded_at, uploaded_by)
    VALUES (?, ?, ?, ?, ?, ?, 'placeholder', NULL, NULL)
  `).run(id, req.params.id, file_name, file_size, description || null, category)

  const attachment = db.prepare('SELECT * FROM attachments WHERE id = ?').get(id)
  res.status(201).json({ success: true, data: attachment })
})

router.patch('/:id/attachments/:attId', (req: Request, res: Response) => {
  const { status, description, uploaded_by } = req.body

  const attachment = db.prepare('SELECT * FROM attachments WHERE id = ? AND registration_id = ?').get(req.params.attId, req.params.id) as Record<string, unknown> | undefined
  if (!attachment) {
    res.status(404).json({ success: false, error: 'Attachment not found' })
    return
  }

  const updates: string[] = []
  const values: unknown[] = []

  if (status !== undefined) {
    updates.push('status = ?')
    values.push(status)
    if (status === 'uploaded') {
      updates.push('uploaded_at = ?')
      values.push(new Date().toISOString())
    }
  }
  if (description !== undefined) {
    updates.push('description = ?')
    values.push(description)
  }
  if (uploaded_by !== undefined) {
    updates.push('uploaded_by = ?')
    values.push(uploaded_by)
  }

  if (updates.length === 0) {
    res.status(400).json({ success: false, error: 'At least one field to update is required' })
    return
  }

  values.push(req.params.attId)
  db.prepare(`UPDATE attachments SET ${updates.join(', ')} WHERE id = ?`).run(...values)

  const updated = db.prepare('SELECT * FROM attachments WHERE id = ?').get(req.params.attId)
  res.json({ success: true, data: updated })
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
