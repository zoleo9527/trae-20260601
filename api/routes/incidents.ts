import { Router, type Request, type Response } from 'express'
import db from '../db.js'
import crypto from 'crypto'

const router = Router()

const STATUS_FLOW = ['pending', 'processing', 'review', 'completed', 'archived']

function mapIncidentRow(row: Record<string, unknown>): Record<string, unknown> {
  return {
    id: row.id,
    incident_no: row.incident_no,
    type: row.type,
    status: row.status,
    location: row.location,
    injured_name: row.injured_name,
    injured_phone: row.injured_phone,
    responsible_person: row.responsible_person,
    description: row.description,
    occurred_at: row.occurred_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

router.get('/', (req: Request, res: Response): void => {
  const { status, responsible_person, search } = req.query

  let sql = 'SELECT * FROM rescue_incidents WHERE 1=1'
  const params: Record<string, unknown> = {}

  if (status && typeof status === 'string') {
    sql += ' AND status = @status'
    params.status = status
  }
  if (responsible_person && typeof responsible_person === 'string') {
    sql += ' AND responsible_person = @responsible_person'
    params.responsible_person = responsible_person
  }
  if (search && typeof search === 'string') {
    sql += ' AND (incident_no LIKE @search OR description LIKE @search OR location LIKE @search OR injured_name LIKE @search)'
    params.search = `%${search}%`
  }

  sql += ' ORDER BY occurred_at DESC'

  const rows = db.prepare(sql).all(params) as Record<string, unknown>[]
  const incidents = rows.map(mapIncidentRow)

  res.json({ success: true, data: incidents })
})

router.get('/:id', (req: Request, res: Response): void => {
  const { id } = req.params

  const row = db.prepare('SELECT * FROM rescue_incidents WHERE id = ?').get(id) as Record<string, unknown> | undefined
  if (!row) {
    res.status(404).json({ success: false, error: 'Incident not found' })
    return
  }

  const incident = mapIncidentRow(row)

  const notes = db.prepare('SELECT * FROM incident_notes WHERE incident_id = ? ORDER BY created_at ASC').all(id)
  const transitions = db.prepare('SELECT * FROM status_transitions WHERE incident_id = ? ORDER BY created_at ASC').all(id)
  const insurance = db.prepare('SELECT * FROM insurance_materials WHERE incident_id = ? ORDER BY created_at ASC').all(id)
  const logs = db.prepare('SELECT * FROM operation_logs WHERE incident_id = ? ORDER BY created_at ASC').all(id)

  res.json({
    success: true,
    data: {
      ...incident,
      notes,
      status_transitions: transitions,
      insurance_materials: insurance,
      operation_logs: logs,
    },
  })
})

router.post('/', (req: Request, res: Response): void => {
  const { incident_no, type, location, injured_name, injured_phone, responsible_person, description, occurred_at } = req.body

  if (!incident_no || !type) {
    res.status(400).json({ success: false, error: 'incident_no and type are required' })
    return
  }

  const id = crypto.randomUUID()
  const now = new Date().toISOString()
  const occurred = occurred_at || now

  db.prepare(`
    INSERT INTO rescue_incidents (id, incident_no, type, status, location, injured_name, injured_phone, responsible_person, description, occurred_at, created_at, updated_at)
    VALUES (?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, incident_no, type, location || null, injured_name || null, injured_phone || null, responsible_person || null, description || null, occurred, now, now)

  db.prepare(`
    INSERT INTO operation_logs (id, incident_id, action, operator, detail, created_at)
    VALUES (?, ?, 'create_incident', ?, ?, ?)
  `).run(crypto.randomUUID(), id, responsible_person || '系统', `创建救援事故 ${incident_no}`, now)

  const row = db.prepare('SELECT * FROM rescue_incidents WHERE id = ?').get(id) as Record<string, unknown>
  const incident = mapIncidentRow(row)
  res.status(201).json({ success: true, data: incident })
})

router.get('/:id/notes', (req: Request, res: Response): void => {
  const { id } = req.params

  const incident = db.prepare('SELECT id FROM rescue_incidents WHERE id = ?').get(id)
  if (!incident) {
    res.status(404).json({ success: false, error: 'Incident not found' })
    return
  }

  const notes = db.prepare('SELECT * FROM incident_notes WHERE incident_id = ? ORDER BY created_at DESC').all(id)
  res.json({ success: true, data: notes })
})

router.post('/:id/notes', (req: Request, res: Response): void => {
  const { id } = req.params
  const { author, category, content, referenced_note_id } = req.body

  if (!author || !category || !content) {
    res.status(400).json({ success: false, error: 'author, category, and content are required' })
    return
  }

  const incident = db.prepare('SELECT id FROM rescue_incidents WHERE id = ?').get(id)
  if (!incident) {
    res.status(404).json({ success: false, error: 'Incident not found' })
    return
  }

  const noteId = crypto.randomUUID()
  const now = new Date().toISOString()

  db.prepare(`
    INSERT INTO incident_notes (id, incident_id, author, category, content, referenced_note_id, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(noteId, id, author, category, content, referenced_note_id || null, now)

  db.prepare(`
    INSERT INTO operation_logs (id, incident_id, action, operator, detail, created_at)
    VALUES (?, ?, 'add_note', ?, ?, ?)
  `).run(crypto.randomUUID(), id, author, `添加${category}分类备注`, now)

  db.prepare(`
    UPDATE rescue_incidents SET updated_at = ? WHERE id = ?
  `).run(now, id)

  const note = db.prepare('SELECT * FROM incident_notes WHERE id = ?').get(noteId)
  res.status(201).json({ success: true, data: note })
})

router.post('/:id/status', (req: Request, res: Response): void => {
  const { id } = req.params
  const { to_status, operator, remark } = req.body

  if (!to_status || !operator) {
    res.status(400).json({ success: false, error: 'to_status and operator are required' })
    return
  }

  const toStatusIndex = STATUS_FLOW.indexOf(to_status)
  if (toStatusIndex === -1) {
    res.status(400).json({ success: false, error: `无效的状态: ${to_status}，必须是以下之一: ${STATUS_FLOW.join(', ')}` })
    return
  }

  const incident = db.prepare('SELECT * FROM rescue_incidents WHERE id = ?').get(id) as Record<string, unknown> | undefined
  if (!incident) {
    res.status(404).json({ success: false, error: 'Incident not found' })
    return
  }

  const fromStatus = incident.status as string
  if (fromStatus === to_status) {
    res.status(400).json({ success: false, error: 'Status unchanged' })
    return
  }

  const fromStatusIndex = STATUS_FLOW.indexOf(fromStatus)
  if (fromStatusIndex === -1) {
    res.status(400).json({ success: false, error: `当前状态无效: ${fromStatus}` })
    return
  }

  if (toStatusIndex !== fromStatusIndex + 1) {
    res.status(400).json({ success: false, error: `无法从当前状态 ${fromStatus} 跳转到状态 ${to_status}，必须按顺序推进` })
    return
  }

  const transitionId = crypto.randomUUID()
  const now = new Date().toISOString()

  db.prepare(`
    INSERT INTO status_transitions (id, incident_id, from_status, to_status, operator, remark, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(transitionId, id, fromStatus, to_status, operator, remark || null, now)

  db.prepare(`
    UPDATE rescue_incidents SET status = ?, updated_at = ? WHERE id = ?
  `).run(to_status, now, id)

  db.prepare(`
    INSERT INTO operation_logs (id, incident_id, action, operator, detail, created_at)
    VALUES (?, ?, 'status_change', ?, ?, ?)
  `).run(crypto.randomUUID(), id, operator, `状态从 ${fromStatus} 变更为 ${to_status}`, now)

  const transition = db.prepare('SELECT * FROM status_transitions WHERE id = ?').get(transitionId)
  res.status(201).json({ success: true, data: transition })
})

router.get('/:id/timeline', (req: Request, res: Response): void => {
  const { id } = req.params

  const incident = db.prepare('SELECT id FROM rescue_incidents WHERE id = ?').get(id)
  if (!incident) {
    res.status(404).json({ success: false, error: 'Incident not found' })
    return
  }

  const notes = db.prepare(`
    SELECT id, 'note' as type, created_at, author as actor, category, content, referenced_note_id
    FROM incident_notes
    WHERE incident_id = ?
  `).all(id)

  const transitions = db.prepare(`
    SELECT id, 'status' as type, created_at, operator as actor, from_status, to_status, remark
    FROM status_transitions
    WHERE incident_id = ?
  `).all(id)

  const logs = db.prepare(`
    SELECT id, 'log' as type, created_at, operator as actor, action, detail
    FROM operation_logs
    WHERE incident_id = ?
  `).all(id)

  const timeline = ([...notes, ...transitions, ...logs] as Array<Record<string, unknown>>).sort(
    (a, b) => new Date(a.created_at as string).getTime() - new Date(b.created_at as string).getTime()
  )

  res.json({ success: true, data: timeline })
})

router.get('/:id/logs', (req: Request, res: Response): void => {
  const { id } = req.params

  const incident = db.prepare('SELECT id FROM rescue_incidents WHERE id = ?').get(id)
  if (!incident) {
    res.status(404).json({ success: false, error: 'Incident not found' })
    return
  }

  const logs = db.prepare('SELECT * FROM operation_logs WHERE incident_id = ? ORDER BY created_at DESC').all(id)
  res.json({ success: true, data: logs })
})

export default router
