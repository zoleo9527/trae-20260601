import { Router, type Request, type Response } from 'express'
import db from '../db.js'
import crypto from 'crypto'

const router = Router()

interface IncidentNote {
  id: string
  incident_id: string
  author: string
  category: string
  content: string
  referenced_note_id: string | null
  created_at: string
}

interface InsuranceMaterialWithNotes extends Record<string, unknown> {
  referenced_notes: IncidentNote[]
  anomaly_referenced_notes: IncidentNote[]
}

function getMaterialWithNotes(material: Record<string, unknown>): InsuranceMaterialWithNotes {
  const noteIdsStr = material.referenced_note_ids as string | null
  let noteIds: string[] = []
  
  if (noteIdsStr) {
    try {
      noteIds = JSON.parse(noteIdsStr)
    } catch {
      noteIds = []
    }
  }
  
  let referencedNotes: IncidentNote[] = []
  if (noteIds.length > 0) {
    const placeholders = noteIds.map(() => '?').join(',')
    referencedNotes = db.prepare(
      `SELECT * FROM incident_notes WHERE id IN (${placeholders})`
    ).all(...noteIds) as IncidentNote[]
  }
  
  const anomalyNoteIdsStr = material.anomaly_referenced_note_ids as string | null
  let anomalyNoteIds: string[] = []
  
  if (anomalyNoteIdsStr) {
    try {
      anomalyNoteIds = JSON.parse(anomalyNoteIdsStr)
    } catch {
      anomalyNoteIds = []
    }
  }
  
  let anomalyReferencedNotes: IncidentNote[] = []
  if (anomalyNoteIds.length > 0) {
    const placeholders = anomalyNoteIds.map(() => '?').join(',')
    anomalyReferencedNotes = db.prepare(
      `SELECT * FROM incident_notes WHERE id IN (${placeholders})`
    ).all(...anomalyNoteIds) as IncidentNote[]
  }
  
  return {
    ...material,
    referenced_notes: referencedNotes,
    anomaly_referenced_notes: anomalyReferencedNotes
  }
}

router.get('/incidents/:id/insurance-materials', (req: Request, res: Response): void => {
  const { id } = req.params

  const incident = db.prepare('SELECT id FROM rescue_incidents WHERE id = ?').get(id)
  if (!incident) {
    res.status(404).json({ success: false, error: 'Incident not found' })
    return
  }

  const materials = db.prepare(
    'SELECT * FROM insurance_materials WHERE incident_id = ? ORDER BY created_at DESC'
  ).all(id) as Record<string, unknown>[]

  const materialsWithNotes = materials.map(m => getMaterialWithNotes(m))

  res.json({ success: true, data: materialsWithNotes })
})

router.post('/incidents/:id/insurance-materials', (req: Request, res: Response): void => {
  const { id } = req.params
  const { material_type, notes, reviewer, referenced_note_ids } = req.body

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
  
  let referencedNoteIdsStr = null
  if (referenced_note_ids && Array.isArray(referenced_note_ids)) {
    referencedNoteIdsStr = JSON.stringify(referenced_note_ids)
  }

  db.prepare(`
    INSERT INTO insurance_materials (id, incident_id, material_type, status, notes, reviewer, anomaly_explanation, referenced_note_ids, anomaly_referenced_note_ids, created_at, updated_at)
    VALUES (?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?)
  `).run(materialId, id, material_type, notes || null, reviewer || null, null, referencedNoteIdsStr, null, now, now)

  db.prepare(`
    INSERT INTO operation_logs (id, incident_id, action, operator, detail, created_at)
    VALUES (?, ?, 'add_insurance_material', ?, ?, ?)
  `).run(crypto.randomUUID(), id, reviewer || '系统', `添加保险材料: ${material_type}`, now)

  db.prepare(`
    UPDATE rescue_incidents SET updated_at = ? WHERE id = ?
  `).run(now, id)

  const material = db.prepare('SELECT * FROM insurance_materials WHERE id = ?').get(materialId) as Record<string, unknown>
  const materialWithNotes = getMaterialWithNotes(material)
  res.status(201).json({ success: true, data: materialWithNotes })
})

router.patch('/incidents/:id/insurance-materials/:materialId', (req: Request, res: Response): void => {
  const { materialId, id } = req.params
  const { status, reviewer, notes, anomaly_explanation, referenced_note_ids, anomaly_referenced_note_ids } = req.body

  const material = db.prepare('SELECT * FROM insurance_materials WHERE id = ?').get(materialId) as Record<string, unknown> | undefined
  if (!material) {
    res.status(404).json({ success: false, error: 'Insurance material not found' })
    return
  }

  const now = new Date().toISOString()
  const incidentId = material.incident_id as string

  let referencedNoteIdsStr = material.referenced_note_ids as string | null
  if (referenced_note_ids !== undefined) {
    if (Array.isArray(referenced_note_ids)) {
      referencedNoteIdsStr = JSON.stringify(referenced_note_ids)
    } else {
      referencedNoteIdsStr = null
    }
  }

  let anomalyReferencedNoteIdsStr = material.anomaly_referenced_note_ids as string | null
  if (anomaly_referenced_note_ids !== undefined) {
    if (Array.isArray(anomaly_referenced_note_ids)) {
      anomalyReferencedNoteIdsStr = JSON.stringify(anomaly_referenced_note_ids)
    } else {
      anomalyReferencedNoteIdsStr = null
    }
  }

  db.prepare(`
    UPDATE insurance_materials
    SET status = COALESCE(?, status), 
        reviewer = COALESCE(?, reviewer), 
        notes = COALESCE(?, notes), 
        anomaly_explanation = COALESCE(?, anomaly_explanation),
        referenced_note_ids = COALESCE(?, referenced_note_ids),
        anomaly_referenced_note_ids = COALESCE(?, anomaly_referenced_note_ids),
        updated_at = ?
    WHERE id = ?
  `).run(status || null, reviewer || null, notes || null, anomaly_explanation || null, referencedNoteIdsStr, anomalyReferencedNoteIdsStr, now, materialId)

  if (status) {
    db.prepare(`
      INSERT INTO operation_logs (id, incident_id, action, operator, detail, created_at)
      VALUES (?, ?, 'update_insurance_material', ?, ?, ?)
    `).run(crypto.randomUUID(), incidentId, reviewer || material.reviewer || '系统', `更新保险材料状态为: ${status}`, now)
  }

  db.prepare(`
    UPDATE rescue_incidents SET updated_at = ? WHERE id = ?
  `).run(now, incidentId)

  const updatedMaterial = db.prepare('SELECT * FROM insurance_materials WHERE id = ?').get(materialId) as Record<string, unknown>
  const updatedMaterialWithNotes = getMaterialWithNotes(updatedMaterial)
  res.json({ success: true, data: updatedMaterialWithNotes })
})

router.post('/incidents/:id/insurance-materials/:materialId/anomaly', (req: Request, res: Response): void => {
  const { materialId, id } = req.params
  const { anomaly_explanation, operator, anomaly_referenced_note_ids } = req.body

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

  let anomalyReferencedNoteIdsStr = null
  if (anomaly_referenced_note_ids && Array.isArray(anomaly_referenced_note_ids)) {
    anomalyReferencedNoteIdsStr = JSON.stringify(anomaly_referenced_note_ids)
  }

  db.prepare(`
    UPDATE insurance_materials
    SET status = 'rejected', anomaly_explanation = ?, anomaly_referenced_note_ids = ?, updated_at = ?
    WHERE id = ?
  `).run(anomaly_explanation, anomalyReferencedNoteIdsStr, now, materialId)

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

  const updatedMaterial = db.prepare('SELECT * FROM insurance_materials WHERE id = ?').get(materialId) as Record<string, unknown>
  const updatedMaterialWithNotes = getMaterialWithNotes(updatedMaterial)
  res.json({ success: true, data: updatedMaterialWithNotes })
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
