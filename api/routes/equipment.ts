import { Router, type Request, type Response } from 'express'
import db from '../db.js'

const router = Router()

router.get('/', (req: Request, res: Response) => {
  const { date, date_from, date_to, status, member } = req.query
  let sql = `SELECT ei.*, b.member_name as booking_member, c.name as booking_course_name, b.booking_date as booking_date, b.time_slot as booking_time_slot, b.status as booking_status FROM equipment_issuances ei LEFT JOIN bookings b ON ei.booking_id = b.id LEFT JOIN courses c ON b.course_id = c.id WHERE 1=1`
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

  const anomalyRows = db.prepare("SELECT issuance_id, id as anomaly_id, description, severity FROM anomalies WHERE issuance_id IS NOT NULL AND status = 'open'").all() as any[]
  const anomalyByIssuance = new Map<number, { anomaly_id: number; description: string; severity: string }[]>()
  for (const a of anomalyRows) {
    if (!anomalyByIssuance.has(a.issuance_id)) anomalyByIssuance.set(a.issuance_id, [])
    anomalyByIssuance.get(a.issuance_id)!.push({ anomaly_id: a.anomaly_id, description: a.description, severity: a.severity })
  }

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
    related_anomalies: anomalyByIssuance.get(row.id) || [],
  }))

  res.json({ success: true, data: result })
})

router.post('/', (req: Request, res: Response) => {
  const idempotencyKey = req.headers['x-idempotency-key'] as string
  if (!idempotencyKey) {
    res.status(400).json({ success: false, error: 'X-Idempotency-Key header is required' })
    return
  }

  const existing = db.prepare('SELECT * FROM equipment_issuances WHERE idempotency_key = ?').get(idempotencyKey) as any
  if (existing) {
    const row = db.prepare(`SELECT ei.*, c.name as booking_course_name, b.booking_date as booking_date, b.time_slot as booking_time_slot, b.status as booking_status FROM equipment_issuances ei LEFT JOIN bookings b ON ei.booking_id = b.id LEFT JOIN courses c ON b.course_id = c.id WHERE ei.id = ?`).get(existing.id) as any
    const anomalyRows = db.prepare("SELECT id as anomaly_id, description, severity FROM anomalies WHERE issuance_id = ? AND status = 'open'").all(existing.id) as any[]
    res.status(200).json({
      success: true,
      data: {
        ...existing,
        booking_summary: row?.booking_id ? { course_name: row.booking_course_name, booking_date: row.booking_date, time_slot: row.booking_time_slot, status: row.booking_status } : null,
        related_anomalies: anomalyRows.map(a => ({ anomaly_id: a.anomaly_id, description: a.description, severity: a.severity })),
      },
    })
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
  res.status(201).json({
    success: true,
    data: {
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
      booking_summary: row.booking_id ? { course_name: row.booking_course_name, booking_date: row.booking_date, time_slot: row.booking_time_slot, status: row.booking_status } : null,
      related_anomalies: [],
    },
  })
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
  const anomalyRows = db.prepare("SELECT id as anomaly_id, description, severity FROM anomalies WHERE issuance_id = ? AND status = 'open'").all(id) as any[]
  res.json({
    success: true,
    data: {
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
      booking_summary: row.booking_id ? { course_name: row.booking_course_name, booking_date: row.booking_date, time_slot: row.booking_time_slot, status: row.booking_status } : null,
      related_anomalies: anomalyRows.map(a => ({ anomaly_id: a.anomaly_id, description: a.description, severity: a.severity })),
    },
  })
})

export default router
