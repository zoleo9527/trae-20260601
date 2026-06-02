import { Router } from 'express'
import { auth } from '../auth'
import { getDb } from '../db'

const router = Router()

router.get('/', auth(['cs', 'supervisor']), (req, res) => {
  const db = getDb()
  const { repair_order_id, rater_id, min_rating } = req.query
  let sql = 'SELECT ev.*, r.title AS repair_title, u.name AS rater_name FROM evaluations ev JOIN repair_orders r ON ev.repair_order_id=r.id JOIN users u ON ev.rater_id=u.id WHERE 1=1'
  const params: any[] = []
  if (repair_order_id) { sql += ' AND ev.repair_order_id=?'; params.push(repair_order_id) }
  if (rater_id) { sql += ' AND ev.rater_id=?'; params.push(rater_id) }
  if (min_rating) { sql += ' AND ev.rating<=?'; params.push(min_rating) }
  sql += ' ORDER BY ev.id DESC'
  res.json(db.prepare(sql).all(...params))
})

router.post('/', auth(['cs']), (req, res) => {
  const { repair_order_id, rater_id, rating, comment } = req.body
  if (!repair_order_id || !rater_id || !rating) {
    return res.status(400).json({ error: '缺少必填字段' })
  }
  if (rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'rating 必须在 1-5 之间' })
  }
  const db = getDb()
  const repair = db.prepare('SELECT status FROM repair_orders WHERE id=?').get(repair_order_id) as any
  if (!repair) return res.status(400).json({ error: '报修单不存在' })
  if (repair.status !== 'completed') return res.status(400).json({ error: '只能评价已完工的报修单' })
  const existing = db.prepare('SELECT id FROM evaluations WHERE repair_order_id=?').get(repair_order_id) as any
  if (existing) return res.status(400).json({ error: '该报修单已有评价' })

  const r = db.prepare('INSERT INTO evaluations (repair_order_id, rater_id, rating, comment) VALUES (?,?,?,?)')
    .run(repair_order_id, rater_id, rating, comment || null)
  res.status(201).json({
    id: r.lastInsertRowid,
    repair_order_id,
    rater_id,
    rating,
    comment: comment || null
  })
})

export default router
