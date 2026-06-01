import { Router, type Request, type Response } from 'express'
import { getDb } from '../db.js'

const router = Router()

router.get('/', (req: Request, res: Response) => {
  const db = getDb()
  const { status } = req.query
  let sql = `
    SELECT f.*, p.name as patient_name, p.owner_name, p.owner_phone, p.species, p.breed
    FROM followups f
    JOIN patients p ON f.patient_id = p.id
    WHERE 1=1
  `
  const params: any[] = []
  if (status) {
    sql += ' AND f.status = ?'
    params.push(status as string)
  }
  sql += ' ORDER BY CASE f.status WHEN \'overdue\' THEN 0 WHEN \'pending\' THEN 1 ELSE 2 END, f.scheduled_date ASC'
  const followups = db.prepare(sql).all(...params)
  res.json({ success: true, data: followups })
})

router.post('/', (req: Request, res: Response) => {
  const db = getDb()
  const { patientId, scheduledDate, reason, notes } = req.body
  const result = db.prepare(`
    INSERT INTO followups (patient_id, scheduled_date, status, reason, notes)
    VALUES (?, ?, 'pending', ?, ?)
  `).run(patientId, scheduledDate, reason, notes || null)
  res.json({ success: true, data: { id: result.lastInsertRowid } })
})

router.put('/:id', (req: Request, res: Response) => {
  const db = getDb()
  const { status, scheduled_date, notes, scheduledDate } = req.body
  const updates: string[] = []
  const values: any[] = []
  if (status !== undefined) { updates.push('status = ?'); values.push(status) }
  if (scheduled_date !== undefined || scheduledDate !== undefined) { updates.push('scheduled_date = ?'); values.push(scheduled_date ?? scheduledDate) }
  if (notes !== undefined) { updates.push('notes = ?'); values.push(notes) }
  if (updates.length === 0) {
    res.status(400).json({ success: false, error: '无可更新字段' })
    return
  }
  values.push(req.params.id)
  db.prepare(`UPDATE followups SET ${updates.join(', ')} WHERE id = ?`).run(...values)
  res.json({ success: true })
})

export default router
