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
    whereClause = 'WHERE b.status = ?'
    params.push(status)
  }

  const total = db.prepare(`SELECT COUNT(*) as count FROM decoction_batches b ${whereClause}`).get(...params).count

  const batches = db.prepare(`
    SELECT b.*, u.name as worker_name, p.code as prescription_code, p.patient_name, p.herbs, p.dosage
    FROM decoction_batches b
    LEFT JOIN users u ON b.worker_id = u.id
    LEFT JOIN prescriptions p ON b.prescription_id = p.id
    ${whereClause}
    ORDER BY b.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, pageSize, offset)

  batches.forEach(b => {
    b.herbs = JSON.parse(b.herbs)
  })

  res.json({ batches, total, page: Number(page), pageSize: Number(pageSize) })
})

router.get('/stats', (req, res) => {
  const db = getDb()
  const stats = {
    pending: db.prepare("SELECT COUNT(*) as count FROM decoction_batches WHERE status = 'pending'").get().count,
    processing: db.prepare("SELECT COUNT(*) as count FROM decoction_batches WHERE status = 'processing'").get().count,
    completed: db.prepare("SELECT COUNT(*) as count FROM decoction_batches WHERE status = 'completed'").get().count,
  }
  stats.total = stats.pending + stats.processing + stats.completed
  res.json({ stats })
})

router.get('/:id', (req, res) => {
  const db = getDb()
  const batch = db.prepare(`
    SELECT b.*, u.name as worker_name, p.code as prescription_code, p.patient_name, p.herbs as prescription_herbs, p.dosage
    FROM decoction_batches b
    LEFT JOIN users u ON b.worker_id = u.id
    LEFT JOIN prescriptions p ON b.prescription_id = p.id
    WHERE b.id = ?
  `).get(req.params.id)

  if (!batch) {
    return res.status(404).json({ error: '批次不存在' })
  }

  batch.prescription_herbs = JSON.parse(batch.prescription_herbs)

  const labels = db.prepare(`
    SELECT * FROM packaging_labels WHERE batch_id = ? ORDER BY created_at ASC
  `).all(batch.id)

  const logs = db.prepare(`
    SELECT * FROM status_logs WHERE entity_type = 'batch' AND entity_id = ? ORDER BY created_at ASC
  `).all(batch.id)

  res.json({ batch, labels, logs })
})

router.post('/', (req, res) => {
  const db = getDb()
  const { prescription_id, decoction_method, water_ratio, duration_minutes, notes } = req.body

  const prescription = db.prepare('SELECT * FROM prescriptions WHERE id = ?').get(prescription_id)
  if (!prescription) {
    return res.status(404).json({ error: '处方不存在' })
  }
  if (prescription.status !== 'approved') {
    return res.status(400).json({ error: '处方未审核通过，无法创建煎药批次' })
  }

  const count = db.prepare('SELECT COUNT(*) as c FROM decoction_batches').get().c
  const batchCode = `BATCH${new Date().toISOString().slice(0, 10).replace(/-/g, '')}${String(count + 1).padStart(4, '0')}`

  const result = db.prepare(`
    INSERT INTO decoction_batches (batch_code, prescription_id, status, decoction_method, water_ratio, duration_minutes, notes, created_at, updated_at)
    VALUES (?, ?, 'pending', ?, ?, ?, ?, datetime('now', 'localtime'), datetime('now', 'localtime'))
  `).run(batchCode, prescription_id, decoction_method || '常规煎煮', water_ratio || '1:10', duration_minutes || 60, notes || '')

  db.prepare(`
    INSERT INTO status_logs (entity_type, entity_id, entity_code, from_status, to_status, operator_id, operator_name, operator_role, note, created_at)
    VALUES ('batch', ?, ?, '', 'pending', ?, ?, ?, '创建煎药批次', datetime('now', 'localtime'))
  `).run(result.lastInsertRowid, batchCode, req.user.id, req.user.name, req.user.role)

  res.status(201).json({ id: result.lastInsertRowid, batch_code: batchCode })
})

router.patch('/:id/status', (req, res) => {
  const db = getDb()
  const { status, note } = req.body
  const batch = db.prepare('SELECT * FROM decoction_batches WHERE id = ?').get(req.params.id)

  if (!batch) {
    return res.status(404).json({ error: '批次不存在' })
  }

  const validTransitions = {
    pending: ['processing'],
    processing: ['completed'],
    completed: [],
  }

  if (!validTransitions[batch.status]?.includes(status)) {
    return res.status(400).json({ error: `不允许从 ${batch.status} 转换到 ${status}` })
  }

  const updates = ['status = ?', 'updated_at = datetime(\'now\', \'localtime\')']
  const params = [status]

  if (status === 'processing') {
    updates.push('worker_id = ?', 'started_at = datetime(\'now\', \'localtime\')')
    params.push(req.user.id)
  }
  if (status === 'completed') {
    updates.push('completed_at = datetime(\'now\', \'localtime\')')
  }

  params.push(batch.id)
  db.prepare(`UPDATE decoction_batches SET ${updates.join(', ')} WHERE id = ?`).run(...params)

  db.prepare(`
    INSERT INTO status_logs (entity_type, entity_id, entity_code, from_status, to_status, operator_id, operator_name, operator_role, note, created_at)
    VALUES ('batch', ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', 'localtime'))
  `).run(batch.id, batch.batch_code, batch.status, status, req.user.id, req.user.name, req.user.role, note || `批次${status === 'processing' ? '开始煎药' : '煎药完成'}`)

  if (status === 'completed') {
    const existingLabels = db.prepare('SELECT COUNT(*) as c FROM packaging_labels WHERE batch_id = ?').get(batch.id).c
    if (existingLabels === 0) {
      const prescription = db.prepare('SELECT dosage FROM prescriptions WHERE id = ?').get(batch.prescription_id)
      const labelCount = db.prepare('SELECT COUNT(*) as c FROM packaging_labels').get().c
      const labelCode = `${batch.batch_code}-L1`

      const labelResult = db.prepare(`
        INSERT INTO packaging_labels (label_code, batch_id, prescription_id, status, package_count, created_at, updated_at)
        VALUES (?, ?, ?, 'pending', ?, datetime('now', 'localtime'), datetime('now', 'localtime'))
      `).run(labelCode, batch.id, batch.prescription_id, prescription.dosage || 1)

      db.prepare(`
        INSERT INTO status_logs (entity_type, entity_id, entity_code, from_status, to_status, operator_id, operator_name, operator_role, note, created_at)
        VALUES ('label', ?, ?, '', 'pending', ?, ?, ?, '煎药完成自动创建贴标', datetime('now', 'localtime'))
      `).run(labelResult.lastInsertRowid, labelCode, req.user.id, req.user.name, req.user.role)
    }
  }

  res.json({ success: true })
})

router.post('/batch-action', (req, res) => {
  const db = getDb()
  const { batch_ids, action, note } = req.body

  if (!batch_ids || !Array.isArray(batch_ids) || batch_ids.length === 0) {
    return res.status(400).json({ error: '请选择批次' })
  }

  const results = { success: [], failed: [] }

  const validActions = {
    start: { from: 'pending', to: 'processing' },
    complete: { from: 'processing', to: 'completed' },
  }

  const transition = validActions[action]
  if (!transition) {
    return res.status(400).json({ error: `不支持的操作: ${action}` })
  }

  for (const id of batch_ids) {
    const batch = db.prepare('SELECT * FROM decoction_batches WHERE id = ?').get(id)
    if (!batch) {
      results.failed.push({ id, reason: '批次不存在' })
      continue
    }
    if (batch.status !== transition.from) {
      results.failed.push({ id, reason: `批次状态为 ${batch.status}，不允许执行 ${action}` })
      continue
    }

    const updates = ['status = ?', 'updated_at = datetime(\'now\', \'localtime\')']
    const params = [transition.to]

    if (transition.to === 'processing') {
      updates.push('worker_id = ?', 'started_at = datetime(\'now\', \'localtime\')')
      params.push(req.user.id)
    }
    if (transition.to === 'completed') {
      updates.push('completed_at = datetime(\'now\', \'localtime\')')
    }

    params.push(id)
    db.prepare(`UPDATE decoction_batches SET ${updates.join(', ')} WHERE id = ?`).run(...params)

    db.prepare(`
      INSERT INTO status_logs (entity_type, entity_id, entity_code, from_status, to_status, operator_id, operator_name, operator_role, note, created_at)
      VALUES ('batch', ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', 'localtime'))
    `).run(batch.id, batch.batch_code, batch.status, transition.to, req.user.id, req.user.name, req.user.role, note || `批量${action === 'start' ? '开始煎药' : '完成煎药'}`)

    results.success.push(id)
  }

  res.json(results)
})

export default router
