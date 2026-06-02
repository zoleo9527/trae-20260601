import { Router } from 'express'
import { auth } from '../auth'
import { getDb } from '../db'

const router = Router()

router.get('/', auth(['cs', 'supervisor']), (req, res) => {
  const db = getDb()
  const { enterprise_id, status, urgency, overdue } = req.query
  let sql = 'SELECT r.*, e.name AS enterprise_name FROM repair_orders r JOIN enterprises e ON r.enterprise_id=e.id WHERE 1=1'
  const params: any[] = []
  if (enterprise_id) { sql += ' AND r.enterprise_id=?'; params.push(enterprise_id) }
  if (status) { sql += ' AND r.status=?'; params.push(status) }
  if (urgency) { sql += ' AND r.urgency=?'; params.push(urgency) }
  if (overdue === '1' || overdue === 'true') {
    sql += " AND r.status NOT IN ('completed','closed') AND r.deadline < datetime('now','localtime')"
  }
  sql += ' ORDER BY r.id DESC'
  res.json(db.prepare(sql).all(...params))
})

router.get('/:id', auth(['cs', 'engineer', 'supervisor']), (req, res) => {
  const db = getDb()
  const row = db.prepare('SELECT r.*, e.name AS enterprise_name FROM repair_orders r JOIN enterprises e ON r.enterprise_id=e.id WHERE r.id=?').get(req.params.id)
  if (!row) return res.status(404).json({ error: '报修单不存在' })
  res.json(row)
})

router.post('/', auth(['cs']), (req, res) => {
  const { enterprise_id, title, description, location, urgency, deadline } = req.body
  if (!enterprise_id || !title || !description || !location || !deadline) {
    return res.status(400).json({ error: '缺少必填字段' })
  }
  const db = getDb()
  const r = db.prepare('INSERT INTO repair_orders (enterprise_id, reporter_id, title, description, location, urgency, status, deadline) VALUES (?,?,?,?,?,?,?,?)')
    .run(enterprise_id, req.currentUser!.id, title, description, location, urgency || 'medium', 'pending', deadline)
  res.status(201).json({
    id: r.lastInsertRowid,
    enterprise_id,
    reporter_id: req.currentUser!.id,
    title, description, location,
    urgency: urgency || 'medium',
    status: 'pending',
    deadline
  })
})

router.put('/:id', auth(['cs']), (req, res) => {
  const db = getDb()
  const existing = db.prepare('SELECT status FROM repair_orders WHERE id=?').get(req.params.id) as any
  if (!existing) return res.status(404).json({ error: '报修单不存在' })
  if (existing.status === 'closed') return res.status(400).json({ error: '已关闭的报修单不能修改' })
  const { title, description, location, urgency, deadline } = req.body
  db.prepare(`UPDATE repair_orders SET title=COALESCE(?,title), description=COALESCE(?,description),
    location=COALESCE(?,location), urgency=COALESCE(?,urgency), deadline=COALESCE(?,deadline) WHERE id=?`)
    .run(title || null, description || null, location || null, urgency || null, deadline || null, req.params.id)
  res.json({ message: '更新成功' })
})

router.put('/:id/close', auth(['cs']), (req, res) => {
  const db = getDb()
  const existing = db.prepare('SELECT status FROM repair_orders WHERE id=?').get(req.params.id) as any
  if (!existing) return res.status(404).json({ error: '报修单不存在' })
  if (existing.status !== 'completed') return res.status(400).json({ error: '只有已完工的报修单才能关闭' })
  db.prepare('UPDATE repair_orders SET status=? WHERE id=?').run('closed', req.params.id)
  res.json({ message: '关闭成功' })
})

export default router
