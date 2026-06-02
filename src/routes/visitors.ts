import { Router } from 'express'
import { auth } from '../auth'
import { getDb } from '../db'

const router = Router()

router.get('/', auth(['cs', 'supervisor', 'gate']), (req, res) => {
  const db = getDb()
  const { enterprise_id, status, visit_date } = req.query
  let sql = 'SELECT v.*, e.name AS enterprise_name, emp.name AS host_name FROM visitors v JOIN enterprises e ON v.enterprise_id=e.id JOIN employees emp ON v.host_employee_id=emp.id WHERE 1=1'
  const params: any[] = []
  if (enterprise_id) { sql += ' AND v.enterprise_id=?'; params.push(enterprise_id) }
  if (status) { sql += ' AND v.status=?'; params.push(status) }
  if (visit_date) { sql += ' AND v.visit_date=?'; params.push(visit_date) }
  sql += ' ORDER BY v.id DESC'
  res.json(db.prepare(sql).all(...params))
})

router.get('/:id', auth(['cs', 'supervisor', 'gate']), (req, res) => {
  const db = getDb()
  const row = db.prepare('SELECT v.*, e.name AS enterprise_name, emp.name AS host_name FROM visitors v JOIN enterprises e ON v.enterprise_id=e.id JOIN employees emp ON v.host_employee_id=emp.id WHERE v.id=?').get(req.params.id)
  if (!row) return res.status(404).json({ error: '访客不存在' })
  res.json(row)
})

router.post('/', auth(['cs']), (req, res) => {
  const { enterprise_id, host_employee_id, name, phone, purpose, visit_date } = req.body
  if (!enterprise_id || !host_employee_id || !name || !phone || !purpose || !visit_date) {
    return res.status(400).json({ error: '缺少必填字段' })
  }
  const db = getDb()
  const r = db.prepare('INSERT INTO visitors (enterprise_id, host_employee_id, name, phone, purpose, visit_date, status) VALUES (?,?,?,?,?,?,?)')
    .run(enterprise_id, host_employee_id, name, phone, purpose, visit_date, 'pending')
  res.status(201).json({ id: r.lastInsertRowid, enterprise_id, host_employee_id, name, phone, purpose, visit_date, status: 'pending' })
})

router.put('/:id/arrive', auth(['gate']), (req, res) => {
  const db = getDb()
  const visitor = db.prepare('SELECT * FROM visitors WHERE id=?').get(req.params.id) as any
  if (!visitor) return res.status(404).json({ error: '访客不存在' })
  if (visitor.status === 'arrived') return res.status(400).json({ error: '访客已签到' })
  if (visitor.status === 'cancelled') return res.status(400).json({ error: '访客已取消' })
  db.prepare('UPDATE visitors SET status=? WHERE id=?').run('arrived', req.params.id)
  res.json({ message: '签到成功', visitor_id: req.params.id, status: 'arrived' })
})

router.put('/:id/cancel', auth(['cs']), (req, res) => {
  const db = getDb()
  const visitor = db.prepare('SELECT * FROM visitors WHERE id=?').get(req.params.id) as any
  if (!visitor) return res.status(404).json({ error: '访客不存在' })
  if (visitor.status === 'arrived') return res.status(400).json({ error: '访客已签到，无法取消' })
  db.prepare('UPDATE visitors SET status=? WHERE id=?').run('cancelled', req.params.id)
  res.json({ message: '取消成功' })
})

export default router
