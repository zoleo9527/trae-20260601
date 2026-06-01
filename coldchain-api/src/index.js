const express = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const { v7: uuidv7 } = require('uuid')
const { getDb, initSchema, auditLog } = require('./db')

const app = express()
app.use(express.json())

const upload = multer({
  dest: path.join(__dirname, '..', 'uploads'),
  limits: { fileSize: 10 * 1024 * 1024 }
})

const SHIPMENT_STATUSES = ['created', 'in_transit', 'delivered', 'disputed', 'closed']
const ANOMALY_STATUSES = ['detected', 'confirmed', 'disputed', 'resolved']
const DISPUTE_STATUSES = ['open', 'reviewing', 'resolved', 'rejected']

function ensureDir() {
  const dir = path.join(__dirname, '..', 'uploads')
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}
ensureDir()

function parseJSON(field) {
  try { return JSON.parse(field) } catch { return field }
}

function safeParseArray(val) {
  if (!val) return []
  if (Array.isArray(val)) return val
  try { return JSON.parse(val) } catch { return [] }
}

const db = initSchema()

function rowToObj(row) {
  if (!row) return row
  const o = { ...row }
  if ('confirmed' in o) o.confirmed = !!o.confirmed
  if ('photo_urls' in o) o.photo_urls = safeParseArray(o.photo_urls)
  if ('anomaly_interval_ids' in o) o.anomaly_interval_ids = safeParseArray(o.anomaly_interval_ids)
  return o
}

app.get('/health', (_req, res) => res.json({ status: 'ok' }))

app.post('/api/shipments', (req, res) => {
  const b = req.body
  if (!b.shipment_no || !b.origin || !b.destination || !b.driver_name || b.temp_min == null || b.temp_max == null) {
    return res.status(400).json({ error: '缺少必填字段: shipment_no, origin, destination, driver_name, temp_min, temp_max' })
  }
  const id = uuidv7()
  const now = new Date().toISOString()
  try {
    db.prepare(`
      INSERT INTO shipments (id, shipment_no, origin, destination, shipper_name, consignee_name,
        driver_name, driver_phone, vehicle_no, temp_min, temp_max, product_name, product_category,
        status, planned_departure, planned_arrival, actual_departure, actual_arrival, created_by, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, b.shipment_no, b.origin, b.destination, b.shipper_name || '', b.consignee_name || '',
      b.driver_name, b.driver_phone || '', b.vehicle_no || '', b.temp_min, b.temp_max,
      b.product_name || '', b.product_category || 'drug', 'created',
      b.planned_departure || null, b.planned_arrival || null, null, null,
      b.created_by || 'system', now, now)

    auditLog(db, {
      entity_type: 'shipment', entity_id: id, action: 'create',
      old_value: null, new_value: 'created', changed_by: b.created_by || 'system',
      details: { shipment_no: b.shipment_no }
    })

    const row = db.prepare('SELECT * FROM shipments WHERE id = ?').get(id)
    res.status(201).json(rowToObj(row))
  } catch (e) {
    if (e.message.includes('UNIQUE')) return res.status(409).json({ error: '运单号已存在' })
    res.status(500).json({ error: e.message })
  }
})

app.get('/api/shipments', (req, res) => {
  const { status, page = 1, limit = 20 } = req.query
  let sql = 'SELECT * FROM shipments'
  const params = []
  const conditions = []
  if (status) { conditions.push('status = ?'); params.push(status) }
  if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ')
  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
  params.push(Number(limit), (Number(page) - 1) * Number(limit))

  const rows = db.prepare(sql).all(...params)
  const total = db.prepare('SELECT COUNT(*) as count FROM shipments' + (conditions.length ? ' WHERE ' + conditions.join(' AND ') : '')).get(...(params.slice(0, conditions.length)))
  res.json({ data: rows.map(rowToObj), total: total.count, page: Number(page), limit: Number(limit) })
})

app.get('/api/shipments/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM shipments WHERE id = ?').get(req.params.id)
  if (!row) return res.status(404).json({ error: '运单不存在' })
  res.json(rowToObj(row))
})

app.patch('/api/shipments/:id/status', (req, res) => {
  const { status, changed_by } = req.body
  if (!SHIPMENT_STATUSES.includes(status)) return res.status(400).json({ error: `无效状态，可选: ${SHIPMENT_STATUSES.join(',')}` })
  const row = db.prepare('SELECT * FROM shipments WHERE id = ?').get(req.params.id)
  if (!row) return res.status(404).json({ error: '运单不存在' })

  const now = new Date().toISOString()
  const updates = ['status = ?', 'updated_at = ?']
  const params = [status, now]

  if (status === 'in_transit' && !row.actual_departure) { updates.push('actual_departure = ?'); params.push(now) }
  if (status === 'delivered' && !row.actual_arrival) { updates.push('actual_arrival = ?'); params.push(now) }
  params.push(req.params.id)

  db.prepare(`UPDATE shipments SET ${updates.join(', ')} WHERE id = ?`).run(...params)

  auditLog(db, {
    entity_type: 'shipment', entity_id: req.params.id, action: 'status_change',
    old_value: row.status, new_value: status, changed_by: changed_by || 'system',
    details: { from: row.status, to: status }
  })

  const updated = db.prepare('SELECT * FROM shipments WHERE id = ?').get(req.params.id)
  res.json(rowToObj(updated))
})

app.get('/api/shipments/:id/full', (req, res) => {
  const shipment = db.prepare('SELECT * FROM shipments WHERE id = ?').get(req.params.id)
  if (!shipment) return res.status(404).json({ error: '运单不存在' })
  const samples = db.prepare('SELECT * FROM temperature_samples WHERE shipment_id = ? ORDER BY recorded_at').all(req.params.id)
  const anomalies = db.prepare('SELECT * FROM anomaly_intervals WHERE shipment_id = ? ORDER BY started_at').all(req.params.id)
  const receipt = db.prepare('SELECT * FROM delivery_receipts WHERE shipment_id = ?').get(req.params.id)
  const disputes = db.prepare('SELECT * FROM disputes WHERE shipment_id = ? ORDER BY created_at').all(req.params.id)
  const logs = db.prepare(`SELECT * FROM audit_logs WHERE entity_type = 'shipment' AND entity_id = ? ORDER BY changed_at`).all(req.params.id)

  res.json({
    shipment: rowToObj(shipment),
    temperature_samples: samples.map(rowToObj),
    anomaly_intervals: anomalies.map(rowToObj),
    delivery_receipt: receipt ? rowToObj(receipt) : null,
    disputes: disputes.map(rowToObj),
    audit_logs: logs
  })
})

app.post('/api/shipments/:id/temperature-samples', (req, res) => {
  const shipment = db.prepare('SELECT * FROM shipments WHERE id = ?').get(req.params.id)
  if (!shipment) return res.status(404).json({ error: '运单不存在' })

  const samples = req.body.samples
  if (!Array.isArray(samples) || samples.length === 0) {
    return res.status(400).json({ error: '需要 samples 数组，至少包含一条采样记录' })
  }

  const insert = db.prepare(`
    INSERT INTO temperature_samples (id, shipment_id, device_id, recorded_at, temperature, latitude, longitude, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const inserted = []
  const now = new Date().toISOString()
  const insertMany = db.transaction((items) => {
    for (const s of items) {
      if (s.recorded_at == null || s.temperature == null) continue
      const id = uuidv7()
      insert.run(id, req.params.id, s.device_id || 'DEV-001', s.recorded_at, s.temperature,
        s.latitude ?? null, s.longitude ?? null, now)
      inserted.push(id)
    }
  })
  insertMany(samples)

  auditLog(db, {
    entity_type: 'shipment', entity_id: req.params.id, action: 'temperature_samples_added',
    old_value: null, new_value: `${inserted.length} samples`, changed_by: req.body.uploaded_by || 'device',
    details: { count: inserted.length, time_range: samples.length ? [samples[0].recorded_at, samples[samples.length - 1].recorded_at] : null }
  })

  res.status(201).json({ count: inserted.length, sample_ids: inserted })
})

app.get('/api/shipments/:id/temperature-samples', (req, res) => {
  const { from, to, page = 1, limit = 200 } = req.query
  let sql = 'SELECT * FROM temperature_samples WHERE shipment_id = ?'
  const params = [req.params.id]
  if (from) { sql += ' AND recorded_at >= ?'; params.push(from) }
  if (to) { sql += ' AND recorded_at <= ?'; params.push(to) }
  sql += ' ORDER BY recorded_at ASC LIMIT ? OFFSET ?'
  params.push(Number(limit), (Number(page) - 1) * Number(limit))

  const rows = db.prepare(sql).all(...params)
  res.json({ data: rows.map(rowToObj), page: Number(page), limit: Number(limit) })
})

app.post('/api/shipments/:id/detect-anomalies', (req, res) => {
  const shipment = db.prepare('SELECT * FROM shipments WHERE id = ?').get(req.params.id)
  if (!shipment) return res.status(404).json({ error: '运单不存在' })

  const { from, to } = req.query
  let sampleSql = 'SELECT * FROM temperature_samples WHERE shipment_id = ?'
  const params = [req.params.id]
  if (from) { sampleSql += ' AND recorded_at >= ?'; params.push(from) }
  if (to) { sampleSql += ' AND recorded_at <= ?'; params.push(to) }
  sampleSql += ' ORDER BY recorded_at ASC'
  const samples = db.prepare(sampleSql).all(...params)

  const violations = samples.filter(s => s.temperature < shipment.temp_min || s.temperature > shipment.temp_max)
  if (violations.length === 0) {
    return res.json({ anomaly_count: 0, anomalies: [], message: '未检测到温度越界' })
  }

  const intervals = []
  let currentStart = violations[0].recorded_at
  let currentEnd = violations[0].recorded_at
  let currentMin = violations[0].temperature
  let currentMax = violations[0].temperature
  let count = 1

  for (let i = 1; i < violations.length; i++) {
    const v = violations[i]
    const prevTime = new Date(currentEnd).getTime()
    const curTime = new Date(v.recorded_at).getTime()
    const gapSeconds = (curTime - prevTime) / 1000

    if (gapSeconds <= 3600) {
      currentEnd = v.recorded_at
      currentMin = Math.min(currentMin, v.temperature)
      currentMax = Math.max(currentMax, v.temperature)
      count++
    } else {
      intervals.push({ started_at: currentStart, ended_at: currentEnd, min_temp: currentMin, max_temp: currentMax, sample_count: count })
      currentStart = v.recorded_at
      currentEnd = v.recorded_at
      currentMin = v.temperature
      currentMax = v.temperature
      count = 1
    }
  }
  intervals.push({ started_at: currentStart, ended_at: currentEnd, min_temp: currentMin, max_temp: currentMax, sample_count: count })

  const insertAnomaly = db.prepare(`
    INSERT INTO anomaly_intervals (id, shipment_id, started_at, ended_at, min_temp, max_temp,
      temp_lower_bound, temp_upper_bound, duration_seconds, sample_count, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'detected', datetime('now'), datetime('now'))
  `)

  const created = []
  const now = new Date().toISOString()
  const insertAll = db.transaction((items) => {
    for (const iv of items) {
      const id = uuidv7()
      const durationSec = Math.round((new Date(iv.ended_at).getTime() - new Date(iv.started_at).getTime()) / 1000)
      insertAnomaly.run(id, req.params.id, iv.started_at, iv.ended_at, iv.min_temp, iv.max_temp,
        shipment.temp_min, shipment.temp_max, durationSec, iv.sample_count)
      created.push(id)
    }
  })
  insertAll(intervals)

  auditLog(db, {
    entity_type: 'shipment', entity_id: req.params.id, action: 'anomalies_detected',
    old_value: null, new_value: `${created.length} intervals`, changed_by: req.body.detected_by || 'system',
    details: { interval_count: created.length }
  })

  const anomalies = created.map((aid, i) => ({
    id: aid, shipment_id: req.params.id, ...intervals[i],
    temp_lower_bound: shipment.temp_min, temp_upper_bound: shipment.temp_max,
    duration_seconds: Math.round((new Date(intervals[i].ended_at).getTime() - new Date(intervals[i].started_at).getTime()) / 1000),
    confirmed: false, status: 'detected'
  }))

  res.status(201).json({ anomaly_count: created.length, anomalies })
})

app.get('/api/shipments/:id/anomaly-intervals', (req, res) => {
  const { from, to, status, confirmed } = req.query
  let sql = 'SELECT * FROM anomaly_intervals WHERE shipment_id = ?'
  const params = [req.params.id]
  if (from) { sql += ' AND started_at >= ?'; params.push(from) }
  if (to) { sql += ' AND ended_at <= ?'; params.push(to) }
  if (status) { sql += ' AND status = ?'; params.push(status) }
  if (confirmed !== undefined) { sql += ' AND confirmed = ?'; params.push(confirmed === 'true' ? 1 : 0) }
  sql += ' ORDER BY started_at ASC'

  const rows = db.prepare(sql).all(...params)
  res.json({ data: rows.map(rowToObj) })
})

app.patch('/api/anomaly-intervals/:id/confirm', (req, res) => {
  const row = db.prepare('SELECT * FROM anomaly_intervals WHERE id = ?').get(req.params.id)
  if (!row) return res.status(404).json({ error: '异常区间不存在' })

  const { confirmed_by } = req.body
  const now = new Date().toISOString()
  db.prepare(`UPDATE anomaly_intervals SET confirmed = 1, confirmed_by = ?, confirmed_at = ?, status = 'confirmed', updated_at = ? WHERE id = ?`)
    .run(confirmed_by || 'qc_staff', now, now, req.params.id)

  auditLog(db, {
    entity_type: 'anomaly_interval', entity_id: req.params.id, action: 'confirm',
    old_value: 'detected', new_value: 'confirmed', changed_by: confirmed_by || 'qc_staff',
    details: { shipment_id: row.shipment_id }
  })

  const updated = db.prepare('SELECT * FROM anomaly_intervals WHERE id = ?').get(req.params.id)
  res.json(rowToObj(updated))
})

app.post('/api/shipments/:id/delivery-receipt', (req, res, next) => {
  const contentType = req.headers['content-type'] || ''
  if (contentType.includes('multipart/form-data')) {
    upload.array('photos', 10)(req, res, next)
  } else {
    next()
  }
}, (req, res) => {
  const shipment = db.prepare('SELECT * FROM shipments WHERE id = ?').get(req.params.id)
  if (!shipment) return res.status(404).json({ error: '运单不存在' })

  const existing = db.prepare('SELECT * FROM delivery_receipts WHERE shipment_id = ?').get(req.params.id)
  if (existing) return res.status(409).json({ error: '该运单已有签收记录' })

  const b = req.body
  const photoUrls = []

  if (req.files && Array.isArray(req.files)) {
    photoUrls.push(...req.files.map(f => `/uploads/${f.filename}`))
  }

  if (b.photo_urls) {
    if (Array.isArray(b.photo_urls)) {
      photoUrls.push(...b.photo_urls)
    } else if (typeof b.photo_urls === 'string') {
      try { photoUrls.push(...JSON.parse(b.photo_urls)) } catch {}
    }
  }

  const id = uuidv7()
  const now = new Date().toISOString()
  db.prepare(`
    INSERT INTO delivery_receipts (id, shipment_id, receiver_name, receiver_phone, received_at,
      temperature_at_delivery, photo_urls, notes, uploaded_by, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, req.params.id, b.receiver_name || '', b.receiver_phone || '',
    b.received_at || now, b.temperature_at_delivery ?? null,
    JSON.stringify(photoUrls), b.notes || '', b.uploaded_by || shipment.driver_name, now)

  db.prepare(`UPDATE shipments SET status = 'delivered', actual_arrival = ?, updated_at = ? WHERE id = ?`)
    .run(b.received_at || now, now, req.params.id)

  auditLog(db, {
    entity_type: 'shipment', entity_id: req.params.id, action: 'delivery_receipt_uploaded',
    old_value: shipment.status, new_value: 'delivered', changed_by: b.uploaded_by || shipment.driver_name,
    details: { receiver: b.receiver_name, photo_count: photoUrls.length, uploaded_files: (req.files || []).length }
  })

  const result = db.prepare('SELECT * FROM delivery_receipts WHERE id = ?').get(id)
  res.status(201).json(rowToObj(result))
})

app.get('/api/shipments/:id/delivery-receipt', (req, res) => {
  const row = db.prepare('SELECT * FROM delivery_receipts WHERE shipment_id = ?').get(req.params.id)
  if (!row) return res.status(404).json({ error: '签收记录不存在' })
  res.json(rowToObj(row))
})

app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')))

app.post('/api/shipments/:id/disputes', (req, res) => {
  const shipment = db.prepare('SELECT * FROM shipments WHERE id = ?').get(req.params.id)
  if (!shipment) return res.status(404).json({ error: '运单不存在' })

  const b = req.body
  if (!b.reason) return res.status(400).json({ error: '需要提供争议原因' })

  const id = uuidv7()
  const now = new Date().toISOString()
  const anomalyIds = b.anomaly_interval_ids || []
  db.prepare(`
    INSERT INTO disputes (id, shipment_id, initiated_by, reason, status, anomaly_interval_ids, evidence_summary, created_at, updated_at)
    VALUES (?, ?, ?, ?, 'open', ?, ?, ?, ?)
  `).run(id, req.params.id, b.initiated_by || 'customer_service', b.reason,
    JSON.stringify(anomalyIds), b.evidence_summary || '', now, now)

  db.prepare(`UPDATE shipments SET status = 'disputed', updated_at = ? WHERE id = ?`).run(now, req.params.id)

  for (const aid of anomalyIds) {
    db.prepare(`UPDATE anomaly_intervals SET status = 'disputed', updated_at = ? WHERE id = ?`).run(now, aid)
  }

  auditLog(db, {
    entity_type: 'shipment', entity_id: req.params.id, action: 'dispute_opened',
    old_value: shipment.status, new_value: 'disputed', changed_by: b.initiated_by || 'customer_service',
    details: { dispute_id: id, reason: b.reason, anomaly_intervals: anomalyIds }
  })

  const result = db.prepare('SELECT * FROM disputes WHERE id = ?').get(id)
  res.status(201).json(rowToObj(result))
})

app.get('/api/shipments/:id/disputes', (req, res) => {
  const rows = db.prepare('SELECT * FROM disputes WHERE shipment_id = ? ORDER BY created_at DESC').all(req.params.id)
  res.json({ data: rows.map(rowToObj) })
})

app.patch('/api/disputes/:id', (req, res) => {
  const dispute = db.prepare('SELECT * FROM disputes WHERE id = ?').get(req.params.id)
  if (!dispute) return res.status(404).json({ error: '争议不存在' })

  const { status, resolution, resolved_by } = req.body
  if (status && !DISPUTE_STATUSES.includes(status)) return res.status(400).json({ error: `无效状态，可选: ${DISPUTE_STATUSES.join(',')}` })

  const newStatus = status || dispute.status
  const now = new Date().toISOString()
  const updates = ['updated_at = ?']
  const params = [now]

  if (newStatus) { updates.push('status = ?'); params.push(newStatus) }
  if (resolution) { updates.push('resolution = ?'); params.push(resolution) }
  if (resolved_by) { updates.push('resolved_by = ?'); params.push(resolved_by) }
  if (['resolved', 'rejected'].includes(newStatus)) { updates.push('resolved_at = ?'); params.push(now) }
  params.push(req.params.id)

  db.prepare(`UPDATE disputes SET ${updates.join(', ')} WHERE id = ?`).run(...params)

  if (['resolved', 'rejected'].includes(newStatus)) {
    const intervalIds = safeParseArray(dispute.anomaly_interval_ids)
    for (const aid of intervalIds) {
      db.prepare(`UPDATE anomaly_intervals SET status = ?, updated_at = ? WHERE id = ?`).run(newStatus === 'resolved' ? 'resolved' : 'detected', now, aid)
      auditLog(db, {
        entity_type: 'anomaly_interval', entity_id: aid, action: 'dispute_' + newStatus,
        old_value: 'disputed', new_value: newStatus === 'resolved' ? 'resolved' : 'detected',
        changed_by: resolved_by || 'qc_staff', details: { dispute_id: req.params.id }
      })
    }

    const shipmentStatus = newStatus === 'resolved' ? 'closed' : 'delivered'
    db.prepare(`UPDATE shipments SET status = ?, updated_at = ? WHERE id = ?`).run(shipmentStatus, now, dispute.shipment_id)
    auditLog(db, {
      entity_type: 'shipment', entity_id: dispute.shipment_id, action: 'dispute_' + newStatus,
      old_value: 'disputed', new_value: shipmentStatus, changed_by: resolved_by || 'qc_staff',
      details: { dispute_id: req.params.id }
    })
  }

  auditLog(db, {
    entity_type: 'dispute', entity_id: req.params.id, action: 'update',
    old_value: dispute.status, new_value: newStatus, changed_by: resolved_by || 'system',
    details: { resolution }
  })

  const result = db.prepare('SELECT * FROM disputes WHERE id = ?').get(req.params.id)
  res.json(rowToObj(result))
})

app.get('/api/disputes', (req, res) => {
  const { status, page = 1, limit = 20 } = req.query
  let sql = 'SELECT * FROM disputes'
  const params = []
  const conditions = []
  if (status) { conditions.push('status = ?'); params.push(status) }
  if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ')
  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
  params.push(Number(limit), (Number(page) - 1) * Number(limit))

  const rows = db.prepare(sql).all(...params)
  res.json({ data: rows.map(rowToObj), page: Number(page), limit: Number(limit) })
})

app.get('/api/audit-logs', (req, res) => {
  const { entity_type, entity_id, action, from, to, page = 1, limit = 50 } = req.query
  let sql = 'SELECT * FROM audit_logs'
  const params = []
  const conditions = []
  if (entity_type) { conditions.push('entity_type = ?'); params.push(entity_type) }
  if (entity_id) { conditions.push('entity_id = ?'); params.push(entity_id) }
  if (action) { conditions.push('action = ?'); params.push(action) }
  if (from) { conditions.push('changed_at >= ?'); params.push(from) }
  if (to) { conditions.push('changed_at <= ?'); params.push(to) }
  if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ')
  sql += ' ORDER BY changed_at DESC LIMIT ? OFFSET ?'
  params.push(Number(limit), (Number(page) - 1) * Number(limit))

  const rows = db.prepare(sql).all(...params)
  res.json({ data: rows.map(r => ({ ...r, details: parseJSON(r.details) })), page: Number(page), limit: Number(limit) })
})

app.get('/api/shipments/:id/temperature-stats', (req, res) => {
  const { from, to } = req.query
  const shipment = db.prepare('SELECT * FROM shipments WHERE id = ?').get(req.params.id)
  if (!shipment) return res.status(404).json({ error: '运单不存在' })

  let sql = 'SELECT COUNT(*) as count, MIN(temperature) as min_temp, MAX(temperature) as max_temp, AVG(temperature) as avg_temp FROM temperature_samples WHERE shipment_id = ?'
  const params = [req.params.id]
  if (from) { sql += ' AND recorded_at >= ?'; params.push(from) }
  if (to) { sql += ' AND recorded_at <= ?'; params.push(to) }

  const stats = db.prepare(sql).get(...params)

  let violationSql = 'SELECT COUNT(*) as count FROM temperature_samples WHERE shipment_id = ? AND (temperature < ? OR temperature > ?)'
  const vParams = [req.params.id, shipment.temp_min, shipment.temp_max]
  if (from) { violationSql += ' AND recorded_at >= ?'; vParams.push(from) }
  if (to) { violationSql += ' AND recorded_at <= ?'; vParams.push(to) }
  const violations = db.prepare(violationSql).get(...vParams)

  res.json({
    shipment_id: req.params.id,
    temp_range: { min: shipment.temp_min, max: shipment.temp_max },
    stats: {
      total_samples: stats.count,
      min_temp: stats.min_temp,
      max_temp: stats.max_temp,
      avg_temp: stats.avg_temp ? Math.round(stats.avg_temp * 100) / 100 : null,
      violation_count: violations.count,
      violation_rate: stats.count ? Math.round(violations.count / stats.count * 10000) / 100 : 0
    },
    time_range: { from, to }
  })
})

app.use((err, _req, res, _next) => {
  console.error(err.stack)
  res.status(500).json({ error: '服务器内部错误' })
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`冷链运输温控追溯 API 已启动: http://localhost:${PORT}`)
  console.log(`OpenAPI 文档: http://localhost:${PORT}/api/docs (参考 openapi.yaml)`)
})

module.exports = app
