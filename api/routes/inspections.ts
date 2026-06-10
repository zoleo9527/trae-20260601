import { Router, type Request, type Response } from 'express'
import db from '../db.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  const { status, coop, overdue } = req.query

  let sql = `
    SELECT i.*, c.code as coop_code, c.name as coop_name, u.name as inspector_name
    FROM inspections i
    LEFT JOIN coops c ON i.coop_id = c.id
    LEFT JOIN users u ON i.inspector_id = u.id
    WHERE 1=1
  `
  const params: unknown[] = []

  if (status) {
    sql += ' AND i.status = ?'
    params.push(status)
  }

  if (coop) {
    sql += ' AND c.code = ?'
    params.push(coop)
  }

  if (overdue === 'true') {
    const cutoff = Math.floor(Date.now() / 1000) - 5 * 3600
    sql += ' AND i.status IN (?, ?) AND i.created_at < ?'
    params.push('pending', 'in_progress', cutoff)
  }

  sql += ' ORDER BY i.created_at DESC'

  const inspections = db.prepare(sql).all(...params)
  res.json({ success: true, data: inspections })
})

router.get('/export', (req: Request, res: Response): void => {
  const { status, coop } = req.query

  let sql = `
    SELECT i.id, c.code as coop_code, c.name as coop_name, u.name as inspector_name,
      i.status, i.temperature, i.humidity, i.ventilation, i.water_status,
      i.feed_status, i.flock_status, i.notes, i.claimed_at, i.completed_at, i.created_at
    FROM inspections i
    LEFT JOIN coops c ON i.coop_id = c.id
    LEFT JOIN users u ON i.inspector_id = u.id
    WHERE 1=1
  `
  const params: unknown[] = []

  if (status) {
    sql += ' AND i.status = ?'
    params.push(status)
  }

  if (coop) {
    sql += ' AND c.code = ?'
    params.push(coop)
  }

  sql += ' ORDER BY i.created_at DESC'

  const inspections = db.prepare(sql).all(...params) as Record<string, unknown>[]

  const headers = [
    'ID', '鸡舍编号', '鸡舍名称', '巡检员', '状态', '温度', '湿度',
    '通风', '饮水', '采食', '鸡群状态', '备注', '领取时间', '完成时间', '创建时间',
  ]
  const rows = inspections.map((r) =>
    [
      r.id, r.coop_code ?? '', r.coop_name ?? '', r.inspector_name ?? '', r.status,
      r.temperature ?? '', r.humidity ?? '', r.ventilation ?? '',
      r.water_status ?? '', r.feed_status ?? '', r.flock_status ?? '',
      r.notes ?? '', r.claimed_at ?? '', r.completed_at ?? '', r.created_at,
    ].map((v) => `"${String(v ?? '')}"`).join(','),
  )
  const csv = [headers.join(','), ...rows].join('\n')
  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', 'attachment; filename=inspections.csv')
  res.send('\uFEFF' + csv)
})

router.get('/:id', (req: Request, res: Response): void => {
  const inspection = db.prepare(`
    SELECT i.*, c.code as coop_code, c.name as coop_name, u.name as inspector_name
    FROM inspections i
    LEFT JOIN coops c ON i.coop_id = c.id
    LEFT JOIN users u ON i.inspector_id = u.id
    WHERE i.id = ?
  `).get(req.params.id) as Record<string, unknown> | undefined

  if (!inspection) {
    res.status(404).json({ success: false, error: '巡检记录不存在' })
    return
  }

  const attachments = db.prepare(
    'SELECT * FROM attachments WHERE entity_type = ? AND entity_id = ?'
  ).all('inspection', req.params.id)

  res.json({ success: true, data: { ...inspection, attachments } })
})

router.post('/', (req: Request, res: Response): void => {
  const { coop_id } = req.body
  if (!coop_id) {
    res.status(400).json({ success: false, error: '请选择鸡舍' })
    return
  }

  const now = Math.floor(Date.now() / 1000)
  const result = db.prepare('INSERT INTO inspections (coop_id, status, created_at) VALUES (?, ?, ?)').run(coop_id, 'pending', now)

  res.json({ success: true, data: { id: result.lastInsertRowid } })
})

router.patch('/:id', (req: Request, res: Response): void => {
  const { status, temperature, humidity, ventilation, water_status, feed_status, flock_status, notes } = req.body

  const inspection = db.prepare('SELECT * FROM inspections WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined
  if (!inspection) {
    res.status(404).json({ success: false, error: '巡检记录不存在' })
    return
  }

  const updates: string[] = []
  const params: unknown[] = []

  if (status !== undefined) { updates.push('status = ?'); params.push(status) }
  if (temperature !== undefined) { updates.push('temperature = ?'); params.push(temperature) }
  if (humidity !== undefined) { updates.push('humidity = ?'); params.push(humidity) }
  if (ventilation !== undefined) { updates.push('ventilation = ?'); params.push(ventilation) }
  if (water_status !== undefined) { updates.push('water_status = ?'); params.push(water_status) }
  if (feed_status !== undefined) { updates.push('feed_status = ?'); params.push(feed_status) }
  if (flock_status !== undefined) { updates.push('flock_status = ?'); params.push(flock_status) }
  if (notes !== undefined) { updates.push('notes = ?'); params.push(notes) }

  if (updates.length === 0) {
    res.status(400).json({ success: false, error: '没有更新内容' })
    return
  }

  if (status === 'completed') {
    updates.push('completed_at = ?')
    params.push(Math.floor(Date.now() / 1000))
  }

  params.push(req.params.id)
  db.prepare(`UPDATE inspections SET ${updates.join(', ')} WHERE id = ?`).run(...params)

  res.json({ success: true, data: { id: Number(req.params.id) } })
})

router.post('/:id/claim', (req: Request, res: Response): void => {
  const userId = req.user?.id
  if (!userId) {
    res.status(401).json({ success: false, error: '未登录' })
    return
  }

  const inspection = db.prepare('SELECT * FROM inspections WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined
  if (!inspection) {
    res.status(404).json({ success: false, error: '巡检记录不存在' })
    return
  }

  if (inspection.status !== 'pending') {
    res.status(400).json({ success: false, error: '只能领取待巡检的巡检卡' })
    return
  }

  const now = Math.floor(Date.now() / 1000)
  db.prepare('UPDATE inspections SET inspector_id = ?, status = ?, claimed_at = ? WHERE id = ?').run(userId, 'in_progress', now, req.params.id)

  res.json({ success: true, data: { id: Number(req.params.id) } })
})

router.post('/:id/confirm', (req: Request, res: Response): void => {
  const inspection = db.prepare('SELECT * FROM inspections WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined
  if (!inspection) {
    res.status(404).json({ success: false, error: '巡检记录不存在' })
    return
  }

  const { action } = req.body
  let newStatus: string
  let completedAt: number | null = null

  if (action === 'confirm') {
    newStatus = 'completed'
    completedAt = Math.floor(Date.now() / 1000)
  } else if (action === 'pending_confirm') {
    newStatus = 'pending_confirm'
  } else {
    res.status(400).json({ success: false, error: '无效操作' })
    return
  }

  db.prepare('UPDATE inspections SET status = ?, completed_at = ? WHERE id = ?').run(newStatus, completedAt, req.params.id)

  res.json({ success: true, data: { id: Number(req.params.id) } })
})

export default router
