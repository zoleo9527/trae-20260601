import { Router, type Request, type Response } from 'express'
import db, { genId } from '../database.js'

const router = Router()

router.get('/', (_req: Request, res: Response) => {
  const seats = db.prepare('SELECT * FROM seats ORDER BY zone, seat_number').all()
  res.json({ success: true, data: seats })
})

router.get('/availability', (_req: Request, res: Response) => {
  const byZone = db.prepare("SELECT zone, COUNT(*) as cnt FROM seats WHERE status = 'available' GROUP BY zone").all() as { zone: string; cnt: number }[]
  const total = db.prepare("SELECT COUNT(*) as cnt FROM seats WHERE status = 'available'").get() as { cnt: number }
  const zoneMap: Record<string, number> = {}
  for (const row of byZone) {
    zoneMap[row.zone] = row.cnt
  }
  res.json({ success: true, data: { total_available: total.cnt, by_zone: zoneMap } })
})

router.get('/allocations', (_req: Request, res: Response) => {
  const allocations = db.prepare(`
    SELECT sa.*,
      (SELECT GROUP_CONCAT(s.seat_number) FROM seats s WHERE s.current_registration_id = sa.registration_id AND s.status IN ('occupied', 'reserved')) as seat_numbers
    FROM seat_allocations sa
    ORDER BY sa.allocated_at DESC
  `).all()
  res.json({ success: true, data: allocations })
})

router.get('/allocations/:id', (req: Request, res: Response) => {
  const allocation = db.prepare('SELECT * FROM seat_allocations WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined
  if (!allocation) {
    res.status(404).json({ success: false, error: 'Allocation not found' })
    return
  }

  const seatIds = (allocation.seat_ids as string || '').split(',')
  const seatDetails = db.prepare(`SELECT * FROM seats WHERE id IN (${seatIds.map(() => '?').join(',')})`).all(...seatIds)
  const registration = db.prepare('SELECT * FROM registrations WHERE id = ?').get(allocation.registration_id)

  res.json({
    success: true,
    data: {
      ...allocation,
      seat_details: seatDetails,
      registration,
    },
  })
})

router.post('/allocations', (req: Request, res: Response) => {
  const { registration_id, seat_ids, allocated_by, conflict_reason } = req.body
  if (!registration_id || !seat_ids || !allocated_by) {
    res.status(400).json({ success: false, error: 'registration_id, seat_ids, and allocated_by are required' })
    return
  }

  const registration = db.prepare('SELECT * FROM registrations WHERE id = ?').get(registration_id) as Record<string, unknown> | undefined
  if (!registration) {
    res.status(404).json({ success: false, error: 'Registration not found' })
    return
  }

  const seatIdArr = Array.isArray(seat_ids) ? seat_ids : seat_ids.split(',')
  let hasConflict = false
  let conflictDesc = ''

  for (const sid of seatIdArr) {
    const seat = db.prepare('SELECT * FROM seats WHERE id = ?').get(sid) as Record<string, unknown> | undefined
    if (!seat) {
      hasConflict = true
      conflictDesc = `座位${sid}不存在`
      break
    }
    if (seat.status === 'occupied' && seat.current_registration_id !== registration_id) {
      hasConflict = true
      conflictDesc = `座位${seat.seat_number}已被其他报名占用`
      break
    }
    if (seat.status === 'maintenance') {
      hasConflict = true
      conflictDesc = `座位${seat.seat_number}正在维修`
      break
    }
  }

  const nowISO = new Date().toISOString()
  const id = genId('alloc')
  const seatIdsStr = seatIdArr.join(',')
  const effectiveConflictReason = conflict_reason || (hasConflict ? conflictDesc : null)
  const [operatorRole, operatorName] = allocated_by.includes('/') ? allocated_by.split('/') : ['未知', allocated_by]

  const transaction = db.transaction(() => {
    db.prepare(`
      INSERT INTO seat_allocations (id, registration_id, seat_ids, allocated_by, confirmed_by, allocated_at, confirmed_at, status, conflict_reason)
      VALUES (?, ?, ?, ?, NULL, ?, NULL, 'pending', ?)
    `).run(id, registration_id, seatIdsStr, allocated_by, nowISO, effectiveConflictReason)

    for (const sid of seatIdArr) {
      const seat = db.prepare('SELECT * FROM seats WHERE id = ?').get(sid) as Record<string, unknown> | undefined
      if (seat && seat.status !== 'occupied') {
        db.prepare('UPDATE seats SET status = ?, current_registration_id = ? WHERE id = ?').run('reserved', registration_id, sid)
      }
    }

    db.prepare('UPDATE registrations SET status = ?, current_owner_role = ?, owner_since = ?, sla_minutes = ? WHERE id = ?').run('seating', '店长', nowISO, 10, registration_id)

    const noteType = hasConflict ? 'dispute' : 'normal'
    db.prepare(`
      INSERT INTO handover_logs (id, registration_id, operator_role, operator_name, action, note_type, note, created_at, from_role, to_role)
      VALUES (?, ?, ?, ?, '分配座位', ?, ?, ?, ?, '店长')
    `).run(genId('log'), registration_id, operatorRole, operatorName, noteType, hasConflict ? `分配座位（有冲突）: ${conflictDesc}` : `分配座位: ${seatIdsStr}`, nowISO, operatorRole)
  })

  transaction()

  const allocation = db.prepare('SELECT * FROM seat_allocations WHERE id = ?').get(id)
  res.status(201).json({ success: true, data: allocation, has_conflict: hasConflict, conflict_description: conflictDesc })
})

router.patch('/allocations/:id', (req: Request, res: Response) => {
  const { status, operator_role, operator_name, note } = req.body
  if (!status || !operator_role || !operator_name) {
    res.status(400).json({ success: false, error: 'status, operator_role, and operator_name are required' })
    return
  }

  const allocation = db.prepare('SELECT * FROM seat_allocations WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined
  if (!allocation) {
    res.status(404).json({ success: false, error: 'Allocation not found' })
    return
  }

  if (!['confirmed', 'released'].includes(status)) {
    res.status(400).json({ success: false, error: 'status must be confirmed or released' })
    return
  }

  const nowISO = new Date().toISOString()
  const operator = `${operator_role}/${operator_name}`
  const seatIds = (allocation.seat_ids as string || '').split(',')

  const transaction = db.transaction(() => {
    if (status === 'confirmed') {
      db.prepare('UPDATE seat_allocations SET status = ?, confirmed_by = ?, confirmed_at = ? WHERE id = ?').run('confirmed', operator, nowISO, req.params.id)
      for (const sid of seatIds) {
        db.prepare('UPDATE seats SET status = ? WHERE id = ?').run('occupied', sid)
      }
      db.prepare('UPDATE registrations SET status = ?, current_owner_role = NULL WHERE id = ?').run('completed', allocation.registration_id)
    } else {
      db.prepare('UPDATE seat_allocations SET status = ? WHERE id = ?').run('released', req.params.id)
      for (const sid of seatIds) {
        db.prepare('UPDATE seats SET status = ?, current_registration_id = NULL WHERE id = ?').run('available', sid)
      }
      db.prepare('UPDATE registrations SET status = ?, current_owner_role = ?, owner_since = ?, sla_minutes = ? WHERE id = ?').run('confirmed', '网管', nowISO, 15, allocation.registration_id)
    }

    const actionLabel = status === 'confirmed' ? '确认座位分配' : '释放座位分配'
    const noteType = status === 'confirmed' ? 'normal' : 'dispute'
    db.prepare(`
      INSERT INTO handover_logs (id, registration_id, operator_role, operator_name, action, note_type, note, created_at, from_role, to_role)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(genId('log'), allocation.registration_id, operator_role, operator_name, actionLabel, noteType, note || `座位分配${status === 'confirmed' ? '已确认' : '已释放'}`, nowISO, operator_role, status === 'confirmed' ? null : '网管')
  })

  transaction()

  const updated = db.prepare('SELECT * FROM seat_allocations WHERE id = ?').get(req.params.id)
  res.json({ success: true, data: updated })
})

export default router
