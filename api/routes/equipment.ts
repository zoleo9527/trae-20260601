import { Router, type Request, type Response } from 'express'
import db from '../db.js'

const router = Router()

function buildRelatedAnomalies(issuanceId: number, bookingId: number | null) {
  const rows = db.prepare(
    `SELECT id as anomaly_id, description, severity,
       CASE WHEN issuance_id = ? THEN 'issuance' ELSE 'booking' END as source
     FROM anomalies
     WHERE status = 'open' AND (issuance_id = ? OR (booking_id = ? AND booking_id IS NOT NULL))
     ORDER BY CASE severity WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 END`
  ).all(issuanceId, issuanceId, bookingId) as { anomaly_id: number; description: string; severity: string; source: string }[]

  const seen = new Set<number>()
  return rows.filter(r => {
    if (seen.has(r.anomaly_id)) return false
    seen.add(r.anomaly_id)
    return true
  })
}

router.get('/', (req: Request, res: Response) => {
  const { date, date_from, date_to, status, member } = req.query
  let sql = `SELECT ei.*, c.name as booking_course_name, b.booking_date as booking_date, b.time_slot as booking_time_slot, b.status as booking_status FROM equipment_issuances ei LEFT JOIN bookings b ON ei.booking_id = b.id LEFT JOIN courses c ON b.course_id = c.id WHERE 1=1`
  const params: any[] = []

  if (date) {
    sql += ' AND date(ei.issued_at) = ?'
    params.push(date)
  }
  if (date_from) {
    sql += ' AND date(ei.issued_at) >= ?'
    params.push(date_from)
  }
  if (date_to) {
    sql += ' AND date(ei.issued_at) <= ?'
    params.push(date_to)
  }
  if (status === 'returned') {
    sql += ' AND ei.returned_at IS NOT NULL'
  } else if (status === 'unreturned') {
    sql += ' AND ei.returned_at IS NULL'
  }
  if (member) {
    sql += ' AND ei.member_name LIKE ?'
    params.push(`%${member}%`)
  }
  sql += ' ORDER BY ei.issued_at DESC'

  const issuances = db.prepare(sql).all(...params) as any[]

  const result = issuances.map((row: any) => ({
    id: row.id,
    booking_id: row.booking_id,
    member_name: row.member_name,
    equipment_type: row.equipment_type,
    equipment_id: row.equipment_id,
    condition_out: row.condition_out,
    condition_in: row.condition_in,
    issued_by: row.issued_by,
    issued_at: row.issued_at,
    returned_at: row.returned_at,
    returned_by: row.returned_by,
    idempotency_key: row.idempotency_key,
    booking_summary: row.booking_id ? {
      course_name: row.booking_course_name,
      booking_date: row.booking_date,
      time_slot: row.booking_time_slot,
      status: row.booking_status,
    } : null,
    related_anomalies: buildRelatedAnomalies(row.id, row.booking_id),
  }))

  res.json({ success: true, data: result })
})

function enrichIssuanceRow(row: any) {
  return {
    id: row.id,
    booking_id: row.booking_id,
    member_name: row.member_name,
    equipment_type: row.equipment_type,
    equipment_id: row.equipment_id,
    condition_out: row.condition_out,
    condition_in: row.condition_in,
    issued_by: row.issued_by,
    issued_at: row.issued_at,
    returned_at: row.returned_at,
    returned_by: row.returned_by,
    idempotency_key: row.idempotency_key,
    booking_summary: row.booking_id ? {
      course_name: row.booking_course_name,
      booking_date: row.booking_date,
      time_slot: row.booking_time_slot,
      status: row.booking_status,
    } : null,
    related_anomalies: buildRelatedAnomalies(row.id, row.booking_id),
  }
}

router.post('/', (req: Request, res: Response) => {
  const idempotencyKey = req.headers['x-idempotency-key'] as string
  if (!idempotencyKey) {
    res.status(400).json({ success: false, error: 'X-Idempotency-Key header is required' })
    return
  }

  const existing = db.prepare('SELECT * FROM equipment_issuances WHERE idempotency_key = ?').get(idempotencyKey) as any
  if (existing) {
    const row = db.prepare(`SELECT ei.*, c.name as booking_course_name, b.booking_date as booking_date, b.time_slot as booking_time_slot, b.status as booking_status FROM equipment_issuances ei LEFT JOIN bookings b ON ei.booking_id = b.id LEFT JOIN courses c ON b.course_id = c.id WHERE ei.id = ?`).get(existing.id) as any
    res.status(200).json({ success: true, data: enrichIssuanceRow(row) })
    return
  }

  const { booking_id, member_name, equipment_type, equipment_id, condition_out, issued_by } = req.body
  if (!member_name || !equipment_type || !equipment_id || !issued_by) {
    res.status(400).json({ success: false, error: 'Missing required fields' })
    return
  }

  const stmt = db.prepare(`INSERT INTO equipment_issuances (booking_id, member_name, equipment_type, equipment_id, condition_out, issued_by, idempotency_key) VALUES (?, ?, ?, ?, ?, ?, ?)`)
  const result = stmt.run(booking_id ?? null, member_name, equipment_type, equipment_id, condition_out || '良好', issued_by, idempotencyKey)

  const row = db.prepare(`SELECT ei.*, c.name as booking_course_name, b.booking_date as booking_date, b.time_slot as booking_time_slot, b.status as booking_status FROM equipment_issuances ei LEFT JOIN bookings b ON ei.booking_id = b.id LEFT JOIN courses c ON b.course_id = c.id WHERE ei.id = ?`).get(result.lastInsertRowid) as any
  res.status(201).json({ success: true, data: enrichIssuanceRow(row) })
})

router.patch('/:id/return', (req: Request, res: Response) => {
  const { id } = req.params
  const { condition_in, returned_by } = req.body

  const issuance = db.prepare('SELECT * FROM equipment_issuances WHERE id = ?').get(id) as any
  if (!issuance) {
    res.status(404).json({ success: false, error: 'Issuance not found' })
    return
  }
  if (issuance.returned_at) {
    res.status(400).json({ success: false, error: 'Equipment already returned' })
    return
  }

  db.prepare("UPDATE equipment_issuances SET condition_in = ?, returned_by = ?, returned_at = datetime('now','localtime') WHERE id = ?").run(condition_in || '良好', returned_by, id)

  const row = db.prepare(`SELECT ei.*, c.name as booking_course_name, b.booking_date as booking_date, b.time_slot as booking_time_slot, b.status as booking_status FROM equipment_issuances ei LEFT JOIN bookings b ON ei.booking_id = b.id LEFT JOIN courses c ON b.course_id = c.id WHERE ei.id = ?`).get(id) as any
  res.json({ success: true, data: enrichIssuanceRow(row) })
})

export default router
