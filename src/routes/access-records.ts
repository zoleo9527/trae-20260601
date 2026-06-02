import { Router } from 'express'
import { auth } from '../auth'
import { getDb } from '../db'

const router = Router()

router.get('/', auth(['gate', 'supervisor']), (req, res) => {
  const db = getDb()
  const { visitor_id, pass_type, gate_no, direction } = req.query
  let sql = 'SELECT a.*, v.name AS visitor_name FROM access_records a LEFT JOIN visitors v ON a.visitor_id=v.id WHERE 1=1'
  const params: any[] = []
  if (visitor_id) { sql += ' AND a.visitor_id=?'; params.push(visitor_id) }
  if (pass_type) { sql += ' AND a.pass_type=?'; params.push(pass_type) }
  if (gate_no) { sql += ' AND a.gate_no=?'; params.push(gate_no) }
  if (direction) { sql += ' AND a.direction=?'; params.push(direction) }
  sql += ' ORDER BY a.id DESC'
  res.json(db.prepare(sql).all(...params))
})

router.post('/', auth(['gate']), (req, res) => {
  const { visitor_id, gate_no, pass_type, direction, note } = req.body
  if (!gate_no || !direction) {
    return res.status(400).json({ error: '缺少 gate_no 或 direction' })
  }
  if (!['in', 'out'].includes(direction)) {
    return res.status(400).json({ error: 'direction 只能是 in 或 out' })
  }
  if (visitor_id) {
    const db2 = getDb()
    const v = db2.prepare('SELECT status FROM visitors WHERE id=?').get(visitor_id) as any
    if (!v) return res.status(400).json({ error: '访客不存在' })
    if (v.status === 'cancelled') return res.status(400).json({ error: '访客已取消预约' })
  }
  const db = getDb()
  const pt = pass_type || (visitor_id ? 'normal' : 'temporary')
  const r = db.prepare('INSERT INTO access_records (visitor_id, gate_no, pass_type, direction, verified_by, note) VALUES (?,?,?,?,?,?)')
    .run(visitor_id || null, gate_no, pt, direction, req.currentUser!.id, note || null)
  res.status(201).json({
    id: r.lastInsertRowid,
    visitor_id: visitor_id || null,
    gate_no,
    pass_type: pt,
    direction,
    verified_by: req.currentUser!.id,
    note: note || null
  })
})

export default router
