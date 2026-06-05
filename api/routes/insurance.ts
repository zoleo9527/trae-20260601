import { Router, type Request, type Response } from 'express'
import db from '../db.js'
import crypto from 'crypto'

const router = Router()

router.get('/incidents/:id/insurance-materials', (req: Request, res: Response): void => {
  const { id } = req.params

  const incident = db.prepare('SELECT id FROM rescue_incidents WHERE id = ?').get(id)
  if (!incident) {
    res.status(404).json({ success: false, error: 'Incident not found' })
    return
  }

  const materials = db.prepare(
    'SELECT * FROM insurance_materials WHERE incident_id = ? ORDER BY created_at DESC'
  ).all(id)

  res.json({ success: true, data: materials })
})

router.post('/incidents/:id/insurance-materials', (req: Request, res: Response): void => {
  const { id } = req.params
  const { material_type, notes, reviewer } = req.body

  if (!material_type) {
    res.status(400).json({ success: false, error: 'material_type is required' })
    return
  }

  const incident = db.prepare('SELECT id FROM rescue_incidents WHERE id = ?').get(id)
  if (!incident) {
    res.status(404).json({ success: false, error: 'Incident not found' })
    return
  }

  const materialId = crypto.randomUUID()
  const now = new Date().toISOString()

  db.prepare(`
    INSERT INTO insurance_materials (id, incident_id, material_type, status, notes, reviewer, anomaly_explanation, created_at, updated_at)
    VALUES (?, ?, ?, 'pending', ?, ?, ?, ?, ?)
  `).run(materialId, id, material_type, notes || null, reviewer || null, null, now, now)

  db.prepare(`
    INSERT INTO operation_logs (id, incident_id, action, operator, detail, created_at)
    VALUES (?, ?, 'add_insurance_material', ?, ?, ?)
  `).run(crypto.randomUUID(), id, reviewer || '系统', `添加保险材料: ${material_type}`, now)

  db.prepare(`
    UPDATE rescue_incidents SET updated_at = ? WHERE id = ?
  `).run(now, id)

  const material = db.prepare('SELECT * FROM insurance_materials WHERE id = ?').get(materialId)
  res.status(201).json({ success: true, data: material })
})

router.patch('/incidents/:id/insurance-materials/:materialId', (req: Request, res: Response): void => {
  const { materialId, id } = req.params
  const { status, reviewer, notes, anomaly_explanation } = req.body

  const material = db.prepare('SELECT * FROM insurance_materials WHERE id = ?').get(materialId) as Record<string, unknown> | undefined
  if (!material) {
    res.status(404).json({ success: false, error: 'Insurance material not found' })
    return
  }

  const now = new Date().toISOString()
  const incidentId = material.incident_id as string

  db.prepare(`
    UPDATE insurance_materials
    SET status = COALESCE(?, status), 
        reviewer = COALESCE(?, reviewer), 
        notes = COALESCE(?, notes), 
        anomaly_explanation = COALESCE(?, anomaly_explanation),
        updated_at = ?
    WHERE id = ?
  `).run(status || null, reviewer || null, notes || null, anomaly_explanation || null, now, materialId)

  if (status) {
    db.prepare(`
      INSERT INTO operation_logs (id, incident_id, action, operator, detail, created_at)
      VALUES (?, ?, 'update_insurance_material', ?, ?, ?)
    `).run(crypto.randomUUID(), incidentId, reviewer || material.reviewer || '系统', `更新保险材料状态为: ${status}`, now)
  }

  db.prepare(`
    UPDATE rescue_incidents SET updated_at = ? WHERE id = ?
  `).run(now, incidentId)

  const updatedMaterial = db.prepare('SELECT * FROM insurance_materials WHERE id = ?').get(materialId)
  res.json({ success: true, data: updatedMaterial })
})

router.post('/incidents/:id/insurance-materials/:materialId/anomaly', (req: Request, res: Response): void => {
  const { materialId, id } = req.params
  const { anomaly_explanation, operator } = req.body

  if (!anomaly_explanation || !operator) {
    res.status(400).json({ success: false, error: 'anomaly_explanation and operator are required' })
    return
  }

  const material = db.prepare('SELECT * FROM insurance_materials WHERE id = ?').get(materialId) as Record<string, unknown> | undefined
  if (!material) {
    res.status(404).json({ success: false, error: 'Insurance material not found' })
    return
  }

  const now = new Date().toISOString()
  const incidentId = material.incident_id as string

  db.prepare(`
    UPDATE insurance_materials
    SET status = 'rejected', anomaly_explanation = ?, updated_at = ?
    WHERE id = ?
  `).run(anomaly_explanation, now, materialId)

  const noteId = crypto.randomUUID()
  db.prepare(`
    INSERT INTO incident_notes (id, incident_id, author, category, content, created_at)
    VALUES (?, ?, ?, 'anomaly', ?, ?)
  `).run(noteId, incidentId, operator, `[材料异常说明] ${anomaly_explanation}`, now)

  db.prepare(`
    INSERT INTO operation_logs (id, incident_id, action, operator, detail, created_at)
    VALUES (?, ?, 'insurance_anomaly', ?, ?, ?)
  `).run(crypto.randomUUID(), incidentId, operator, `保险材料异常: ${anomaly_explanation}`, now)

  db.prepare(`
    UPDATE rescue_incidents SET updated_at = ? WHERE id = ?
  `).run(now, incidentId)

  const updatedMaterial = db.prepare('SELECT * FROM insurance_materials WHERE id = ?').get(materialId)
  res.json({ success: true, data: updatedMaterial })
})

router.get('/incidents/:id/notes/rescue-medical', (req: Request, res: Response): void => {
  const { id } = req.params

  const incident = db.prepare('SELECT id FROM rescue_incidents WHERE id = ?').get(id)
  if (!incident) {
    res.status(404).json({ success: false, error: 'Incident not found' })
    return
  }

  const notes = db.prepare(`
    SELECT * FROM incident_notes 
    WHERE incident_id = ? AND (category = 'rescue' OR category = 'medical')
    ORDER BY created_at DESC
  `).all(id)

  res.json({ success: true, data: notes })
})

export default router
