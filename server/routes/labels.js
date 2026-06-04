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
  const { status, batch_id, page = 1, pageSize = 20 } = req.query
  const offset = (page - 1) * pageSize

  const conditions = []
  const params = []

  if (status) {
    conditions.push('pl.status = ?')
    params.push(status)
  }
  if (batch_id) {
    conditions.push('pl.batch_id = ?')
    params.push(batch_id)
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  const total = db.prepare(`SELECT COUNT(*) as count FROM packaging_labels pl ${whereClause}`).get(...params).count

  const labels = db.prepare(`
    SELECT pl.*, b.batch_code, b.status as batch_status, p.code as prescription_code, p.patient_name
    FROM packaging_labels pl
    LEFT JOIN decoction_batches b ON pl.batch_id = b.id
    LEFT JOIN prescriptions p ON pl.prescription_id = p.id
    ${whereClause}
    ORDER BY pl.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, pageSize, offset)

  res.json({ labels, total, page: Number(page), pageSize: Number(pageSize) })
})

router.get('/stats', (req, res) => {
  const db = getDb()
  const stats = {
    pending: db.prepare("SELECT COUNT(*) as count FROM packaging_labels WHERE status = 'pending'").get().count,
    labeled: db.prepare("SELECT COUNT(*) as count FROM packaging_labels WHERE status = 'labeled'").get().count,
    ready_ship: db.prepare("SELECT COUNT(*) as count FROM packaging_labels WHERE status = 'ready_ship'").get().count,
    shipping: db.prepare("SELECT COUNT(*) as count FROM packaging_labels WHERE status = 'shipping'").get().count,
    delivered: db.prepare("SELECT COUNT(*) as count FROM packaging_labels WHERE status = 'delivered'").get().count,
    returned: db.prepare("SELECT COUNT(*) as count FROM packaging_labels WHERE status = 'returned'").get().count,
  }
  stats.total = Object.values(stats).reduce((a, b) => a + b, 0)
  res.json({ stats })
})

router.get('/:id', (req, res) => {
  const db = getDb()
  const label = db.prepare(`
    SELECT pl.*, b.batch_code, b.batch_code as batch_code_val, b.status as batch_status,
           b.decoction_method, b.water_ratio, b.duration_minutes, b.started_at as batch_started_at, b.completed_at as batch_completed_at,
           p.code as prescription_code, p.patient_name, p.herbs as prescription_herbs, p.dosage
    FROM packaging_labels pl
    LEFT JOIN decoction_batches b ON pl.batch_id = b.id
    LEFT JOIN prescriptions p ON pl.prescription_id = p.id
    WHERE pl.id = ?
  `).get(req.params.id)

  if (!label) {
    return res.status(404).json({ error: '贴标不存在' })
  }

  if (label.prescription_herbs) {
    label.prescription_herbs = JSON.parse(label.prescription_herbs)
  }

  const logs = db.prepare(`
    SELECT * FROM status_logs WHERE entity_type = 'label' AND entity_id = ? ORDER BY created_at ASC
  `).all(label.id)

  res.json({ label, logs })
})

router.patch('/:id/status', (req, res) => {
  const db = getDb()
  const { status, note, tracking_no, courier, package_count } = req.body
  const label = db.prepare('SELECT * FROM packaging_labels WHERE id = ?').get(req.params.id)

  if (!label) {
    return res.status(404).json({ error: '贴标不存在' })
  }

  const validTransitions = {
    pending: ['labeled'],
    labeled: ['ready_ship'],
    ready_ship: ['shipping'],
    shipping: ['delivered', 'returned'],
    delivered: [],
    returned: ['pending'],
  }

  if (!validTransitions[label.status]?.includes(status)) {
    return res.status(400).json({ error: `不允许从 ${label.status} 转换到 ${status}` })
  }

  const updates = ['status = ?', 'updated_at = datetime(\'now\', \'localtime\')']
  const params = [status]

  if (status === 'labeled') {
    updates.push('labeled_at = datetime(\'now\', \'localtime\')')
    if (package_count) {
      updates.push('package_count = ?')
      params.push(package_count)
    }
  }
  if (status === 'shipping') {
    updates.push('shipped_at = datetime(\'now\', \'localtime\')')
    if (tracking_no) {
      updates.push('tracking_no = ?')
      params.push(tracking_no)
    }
    if (courier) {
      updates.push('courier = ?')
      params.push(courier)
    }
  }
  if (status === 'delivered') {
    updates.push('delivered_at = datetime(\'now\', \'localtime\')')
  }
  if (status === 'returned') {
    if (note) {
      updates.push('notes = ?')
      params.push(note)
    }
  }

  params.push(label.id)
  db.prepare(`UPDATE packaging_labels SET ${updates.join(', ')} WHERE id = ?`).run(...params)

  const statusNote = {
    labeled: '贴标完成',
    ready_ship: '备货完成，待配送',
    shipping: `已发货${tracking_no ? `，快递单号：${tracking_no}` : ''}`,
    delivered: '患者已签收',
    returned: `退回：${note || ''}`,
    pending: '重新贴标',
  }

  db.prepare(`
    INSERT INTO status_logs (entity_type, entity_id, entity_code, from_status, to_status, operator_id, operator_name, operator_role, note, created_at)
    VALUES ('label', ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', 'localtime'))
  `).run(label.id, label.label_code, label.status, status, req.user.id, req.user.name, req.user.role, note || statusNote[status])

  res.json({ success: true })
})

router.post('/batch-action', (req, res) => {
  const db = getDb()
  const { label_ids, action, tracking_no, courier, note } = req.body

  if (!label_ids || !Array.isArray(label_ids) || label_ids.length === 0) {
    return res.status(400).json({ error: '请选择贴标' })
  }

  const results = { success: [], failed: [] }

  const validActions = {
    label: { from: 'pending', to: 'labeled' },
    ready: { from: 'labeled', to: 'ready_ship' },
    ship: { from: 'ready_ship', to: 'shipping' },
    deliver: { from: 'shipping', to: 'delivered' },
  }

  const transition = validActions[action]
  if (!transition) {
    return res.status(400).json({ error: `不支持的操作: ${action}` })
  }

  for (const id of label_ids) {
    const label = db.prepare('SELECT * FROM packaging_labels WHERE id = ?').get(id)
    if (!label) {
      results.failed.push({ id, reason: '贴标不存在' })
      continue
    }
    if (label.status !== transition.from) {
      results.failed.push({ id, reason: `贴标状态为 ${label.status}，不允许执行 ${action}` })
      continue
    }

    const updates = ['status = ?', 'updated_at = datetime(\'now\', \'localtime\')']
    const params = [transition.to]

    if (transition.to === 'labeled') {
      updates.push('labeled_at = datetime(\'now\', \'localtime\')')
    }
    if (transition.to === 'shipping') {
      updates.push('shipped_at = datetime(\'now\', \'localtime\')')
      if (tracking_no) {
        updates.push('tracking_no = ?')
        params.push(tracking_no)
      }
      if (courier) {
        updates.push('courier = ?')
        params.push(courier)
      }
    }
    if (transition.to === 'delivered') {
      updates.push('delivered_at = datetime(\'now\', \'localtime\')')
    }

    params.push(id)
    db.prepare(`UPDATE packaging_labels SET ${updates.join(', ')} WHERE id = ?`).run(...params)

    const statusNote = {
      labeled: '批量贴标完成',
      ready_ship: '批量备货完成',
      shipping: `批量发货${tracking_no ? `，快递单号：${tracking_no}` : ''}`,
      delivered: '批量签收确认',
    }

    db.prepare(`
      INSERT INTO status_logs (entity_type, entity_id, entity_code, from_status, to_status, operator_id, operator_name, operator_role, note, created_at)
      VALUES ('label', ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', 'localtime'))
    `).run(label.id, label.label_code, label.status, transition.to, req.user.id, req.user.name, req.user.role, note || statusNote[transition.to])

    results.success.push(id)
  }

  res.json(results)
})

export default router
