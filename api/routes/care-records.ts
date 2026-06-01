import { Router, type Request, type Response } from 'express'
import { getDb } from '../db.js'

const router = Router()

router.get('/patient/:patientId', (req: Request, res: Response) => {
  const db = getDb()
  const { type } = req.query
  let sql = 'SELECT * FROM care_records WHERE patient_id = ?'
  const params: any[] = [req.params.patientId]
  if (type) {
    sql += ' AND type = ?'
    params.push(type as string)
  }
  sql += ' ORDER BY scheduled_at DESC'
  const records = db.prepare(sql).all(...params)
  res.json({ success: true, data: records })
})

router.get('/today', (req: Request, res: Response) => {
  const db = getDb()
  const today = new Date().toISOString().slice(0, 10)
  const records = db.prepare(`
    SELECT cr.*, p.name as patient_name, p.cage_number, p.species
    FROM care_records cr
    JOIN patients p ON cr.patient_id = p.id
    WHERE DATE(cr.scheduled_at) = ? AND p.status = 'hospitalized'
    ORDER BY cr.scheduled_at ASC
  `).all(today)
  res.json({ success: true, data: records })
})

router.post('/patient/:patientId', (req: Request, res: Response) => {
  const db = getDb()
  const { type, content, scheduledAt, executedBy } = req.body
  const result = db.prepare(`
    INSERT INTO care_records (patient_id, type, content, scheduled_at, executed_by, status, is_abnormal)
    VALUES (?, ?, ?, ?, ?, 'pending', 0)
  `).run(req.params.patientId, type, content, scheduledAt, executedBy || null)
  res.json({ success: true, data: { id: result.lastInsertRowid } })
})

router.put('/:id', (req: Request, res: Response) => {
  const db = getDb()
  const { status, executed_at, executed_by, is_abnormal, abnormal_note, executedAt, executedBy, isAbnormal, abnormalNote } = req.body
  const updates: string[] = []
  const values: any[] = []
  if (status !== undefined) { updates.push('status = ?'); values.push(status) }
  if (executed_at !== undefined || executedAt !== undefined) { updates.push('executed_at = ?'); values.push(executed_at ?? executedAt) }
  if (executed_by !== undefined || executedBy !== undefined) { updates.push('executed_by = ?'); values.push(executed_by ?? executedBy) }
  if (is_abnormal !== undefined || isAbnormal !== undefined) { updates.push('is_abnormal = ?'); values.push((is_abnormal ?? isAbnormal) ? 1 : 0) }
  if (abnormal_note !== undefined || abnormalNote !== undefined) { updates.push('abnormal_note = ?'); values.push(abnormal_note ?? abnormalNote) }
  if (updates.length === 0) {
    res.status(400).json({ success: false, error: '无可更新字段' })
    return
  }
  values.push(req.params.id)
  db.prepare(`UPDATE care_records SET ${updates.join(', ')} WHERE id = ?`).run(...values)
  res.json({ success: true })
})

export default router
