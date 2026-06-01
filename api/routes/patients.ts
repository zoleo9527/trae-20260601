import { Router, type Request, type Response } from 'express'
import { getDb } from '../db.js'

const router = Router()

router.get('/', (req: Request, res: Response) => {
  const db = getDb()
  const patients = db.prepare(`
    SELECT p.*,
      (SELECT COUNT(*) FROM care_records cr WHERE cr.patient_id = p.id AND cr.status = 'pending') as pending_tasks,
      (SELECT COUNT(*) FROM care_records cr WHERE cr.patient_id = p.id AND cr.is_abnormal = 1) as abnormal_count,
      (SELECT COUNT(*) FROM followups f WHERE f.patient_id = p.id AND f.status IN ('pending', 'overdue')) as pending_followups
    FROM patients p
    ORDER BY p.status = 'hospitalized' DESC, p.admit_date DESC
  `).all()
  res.json({ success: true, data: patients })
})

router.get('/:id', (req: Request, res: Response) => {
  const db = getDb()
  const patient = db.prepare('SELECT * FROM patients WHERE id = ?').get(req.params.id)
  if (!patient) {
    res.status(404).json({ success: false, error: '患者未找到' })
    return
  }
  res.json({ success: true, data: patient })
})

router.post('/', (req: Request, res: Response) => {
  const db = getDb()
  const { name, species, breed, age, ownerName, ownerPhone, admitDate, diagnosis, cageNumber, conditionTrend } = req.body
  const result = db.prepare(`
    INSERT INTO patients (name, species, breed, age, owner_name, owner_phone, admit_date, diagnosis, status, cage_number, condition_trend)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'hospitalized', ?, ?)
  `).run(name, species, breed, age, ownerName, ownerPhone, admitDate, diagnosis, cageNumber, conditionTrend || null)
  res.json({ success: true, data: { id: result.lastInsertRowid } })
})

router.put('/:id', (req: Request, res: Response) => {
  const db = getDb()
  const allowed = ['status', 'conditionTrend', 'diagnosis']
  const updates: string[] = []
  const values: any[] = []
  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      const col = key === 'conditionTrend' ? 'condition_trend' : key
      updates.push(`${col} = ?`)
      values.push(req.body[key])
    }
  }
  if (updates.length === 0) {
    res.status(400).json({ success: false, error: '无可更新字段' })
    return
  }
  values.push(req.params.id)
  db.prepare(`UPDATE patients SET ${updates.join(', ')} WHERE id = ?`).run(...values)
  res.json({ success: true })
})

export default router
