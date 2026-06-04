import { Router } from 'express'
import { getDb } from '../db.js'

const router = Router()

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未登录' })
  }
  try {
    req.user = JSON.parse(Buffer.from(auth.slice(7), 'base64').toString())
    next()
  } catch {
    res.status(401).json({ error: 'token 无效' })
  }
}

router.use(authMiddleware)

router.get('/', (req, res) => {
  const db = getDb()
  const { status, page = 1, pageSize = 20 } = req.query
  const offset = (page - 1) * pageSize

  let whereClause = ''
  const params = []

  if (status) {
    whereClause = 'WHERE p.status = ?'
    params.push(status)
  }

  const total = db.prepare(`SELECT COUNT(*) as count FROM prescriptions p ${whereClause}`).get(...params).count

  const prescriptions = db.prepare(`
    SELECT p.*, u.name as reviewer_name
    FROM prescriptions p
    LEFT JOIN users u ON p.reviewer_id = u.id
    ${whereClause}
    ORDER BY p.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, pageSize, offset)

  prescriptions.forEach(p => {
    p.herbs = JSON.parse(p.herbs)
  })

  res.json({ prescriptions, total, page: Number(page), pageSize: Number(pageSize) })
})

router.get('/stats', (req, res) => {
  const db = getDb()
  const stats = {
    pending_review: db.prepare("SELECT COUNT(*) as count FROM prescriptions WHERE status = 'pending_review'").get().count,
    approved: db.prepare("SELECT COUNT(*) as count FROM prescriptions WHERE status = 'approved'").get().count,
    rejected: db.prepare("SELECT COUNT(*) as count FROM prescriptions WHERE status = 'rejected'").get().count,
  }
  stats.total = stats.pending_review + stats.approved + stats.rejected
  res.json({ stats })
})

router.get('/:id', (req, res) => {
  const db = getDb()
  const prescription = db.prepare(`
    SELECT p.*, u.name as reviewer_name
    FROM prescriptions p
    LEFT JOIN users u ON p.reviewer_id = u.id
    WHERE p.id = ?
  `).get(req.params.id)

  if (!prescription) {
    return res.status(404).json({ error: '处方不存在' })
  }

  prescription.herbs = JSON.parse(prescription.herbs)

  const batches = db.prepare(`
    SELECT b.*, u.name as worker_name
    FROM decoction_batches b
    LEFT JOIN users u ON b.worker_id = u.id
    WHERE b.prescription_id = ?
    ORDER BY b.created_at DESC
  `).all(prescription.id)

  const labels = db.prepare(`
    SELECT pl.*
    FROM packaging_labels pl
    WHERE pl.prescription_id = ?
    ORDER BY pl.created_at DESC
  `).all(prescription.id)

  const logs = db.prepare(`
    SELECT * FROM status_logs
    WHERE entity_type = 'prescription' AND entity_id = ?
    ORDER BY created_at ASC
  `).all(prescription.id)

  res.json({ prescription, batches, labels, logs })
})

router.post('/', (req, res) => {
  const db = getDb()
  const { patient_name, herbs, dosage, notes } = req.body

  const count = db.prepare('SELECT COUNT(*) as c FROM prescriptions').get().c
  const code = `RX${new Date().toISOString().slice(0, 10).replace(/-/g, '')}${String(count + 1).padStart(4, '0')}`

  const result = db.prepare(`
    INSERT INTO prescriptions (code, patient_name, herbs, dosage, notes, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 'pending_review', datetime('now', 'localtime'), datetime('now', 'localtime'))
  `).run(code, patient_name, JSON.stringify(herbs), dosage || 1, notes || '')

  db.prepare(`
    INSERT INTO status_logs (entity_type, entity_id, entity_code, from_status, to_status, operator_id, operator_name, operator_role, note, created_at)
    VALUES ('prescription', ?, ?, '', 'pending_review', ?, ?, ?, '创建处方', datetime('now', 'localtime'))
  `).run(result.lastInsertRowid, code, req.user.id, req.user.name, req.user.role)

  res.status(201).json({ id: result.lastInsertRowid, code })
})

router.patch('/:id/status', (req, res) => {
  const db = getDb()
  const { status, note } = req.body
  const prescription = db.prepare('SELECT * FROM prescriptions WHERE id = ?').get(req.params.id)

  if (!prescription) {
    return res.status(404).json({ error: '处方不存在' })
  }

  const validTransitions = {
    pending_review: ['approved', 'rejected'],
    approved: [],
    rejected: ['pending_review'],
  }

  if (!validTransitions[prescription.status]?.includes(status)) {
    return res.status(400).json({ error: `不允许从 ${prescription.status} 转换到 ${status}` })
  }

  db.prepare(`
    UPDATE prescriptions
    SET status = ?, reviewer_id = ?, reviewed_at = datetime('now', 'localtime'), updated_at = datetime('now', 'localtime')
    WHERE id = ?
  `).run(status, req.user.id, prescription.id)

  db.prepare(`
    INSERT INTO status_logs (entity_type, entity_id, entity_code, from_status, to_status, operator_id, operator_name, operator_role, note, created_at)
    VALUES ('prescription', ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', 'localtime'))
  `).run(prescription.id, prescription.code, prescription.status, status, req.user.id, req.user.name, req.user.role, note || `处方${status === 'approved' ? '审核通过' : '审核驳回'}`)

  res.json({ success: true })
})

export default router
