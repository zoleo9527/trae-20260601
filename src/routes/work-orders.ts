import { Router } from 'express'
import { auth } from '../auth'
import { getDb } from '../db'

const router = Router()

router.get('/', auth(['cs', 'engineer', 'supervisor']), (req, res) => {
  const db = getDb()
  const { repair_order_id, engineer_id, status } = req.query
  let sql = 'SELECT w.*, r.title AS repair_title, u.name AS engineer_name FROM work_orders w LEFT JOIN repair_orders r ON w.repair_order_id=r.id LEFT JOIN users u ON w.engineer_id=u.id WHERE 1=1'
  const params: any[] = []
  if (repair_order_id) { sql += ' AND w.repair_order_id=?'; params.push(repair_order_id) }
  if (engineer_id) { sql += ' AND w.engineer_id=?'; params.push(engineer_id) }
  if (status) { sql += ' AND w.status=?'; params.push(status) }
  sql += ' ORDER BY w.id DESC'
  res.json(db.prepare(sql).all(...params))
})

router.get('/mine', auth(['engineer']), (req, res) => {
  const db = getDb()
  const list = db.prepare('SELECT w.*, r.title AS repair_title, r.location, r.urgency FROM work_orders w JOIN repair_orders r ON w.repair_order_id=r.id WHERE w.engineer_id=? ORDER BY w.id DESC')
    .all(req.currentUser!.id)
  res.json(list)
})

router.post('/', auth(['cs']), (req, res) => {
  const { repair_order_id, engineer_id, note } = req.body
  if (!repair_order_id || !engineer_id) {
    return res.status(400).json({ error: '缺少 repair_order_id 或 engineer_id' })
  }
  const db = getDb()
  const eng = db.prepare('SELECT id, role FROM users WHERE id=?').get(engineer_id) as any
  if (!eng || eng.role !== 'engineer') {
    return res.status(400).json({ error: '指派人不是工程师角色' })
  }
  const repair = db.prepare('SELECT status FROM repair_orders WHERE id=?').get(repair_order_id) as any
  if (!repair) return res.status(400).json({ error: '报修单不存在' })
  if (repair.status === 'completed' || repair.status === 'closed') {
    return res.status(400).json({ error: '报修单已完工或关闭' })
  }
  const existing = db.prepare('SELECT id FROM work_orders WHERE repair_order_id=? AND status NOT IN (?,?,?)')
    .get(repair_order_id, 'completed', 'reassigned', 'assigned') as any
  if (existing) return res.status(400).json({ error: '该报修单已有进行中的派工单' })

  const r = db.prepare('INSERT INTO work_orders (repair_order_id, engineer_id, status, note) VALUES (?,?,?,?)')
    .run(repair_order_id, engineer_id, 'assigned', note || null)
  db.prepare('UPDATE repair_orders SET status=? WHERE id=?').run('assigned', repair_order_id)
  res.status(201).json({
    id: r.lastInsertRowid,
    repair_order_id,
    engineer_id,
    status: 'assigned',
    note: note || null
  })
})

router.put('/:id/accept', auth(['engineer']), (req, res) => {
  const db = getDb()
  const wo = db.prepare('SELECT * FROM work_orders WHERE id=?').get(req.params.id) as any
  if (!wo) return res.status(404).json({ error: '派工单不存在' })
  if (wo.engineer_id !== req.currentUser!.id) return res.status(403).json({ error: '只能接自己的工单' })
  if (wo.status !== 'assigned') return res.status(400).json({ error: '当前状态不能接单' })
  db.prepare("UPDATE work_orders SET status='accepted', accepted_at=datetime('now','localtime') WHERE id=?").run(req.params.id)
  db.prepare("UPDATE repair_orders SET status='in_progress' WHERE id=?").run(wo.repair_order_id)
  res.json({ message: '接单成功' })
})

router.put('/:id/start', auth(['engineer']), (req, res) => {
  const db = getDb()
  const wo = db.prepare('SELECT * FROM work_orders WHERE id=?').get(req.params.id) as any
  if (!wo) return res.status(404).json({ error: '派工单不存在' })
  if (wo.engineer_id !== req.currentUser!.id) return res.status(403).json({ error: '只能操作自己的工单' })
  if (wo.status !== 'accepted') return res.status(400).json({ error: '当前状态不能开工' })
  db.prepare("UPDATE work_orders SET status='in_progress' WHERE id=?").run(req.params.id)
  res.json({ message: '开工成功' })
})

router.put('/:id/complete', auth(['engineer']), (req, res) => {
  const { note } = req.body
  const db = getDb()
  const wo = db.prepare('SELECT * FROM work_orders WHERE id=?').get(req.params.id) as any
  if (!wo) return res.status(404).json({ error: '派工单不存在' })
  if (wo.engineer_id !== req.currentUser!.id) return res.status(403).json({ error: '只能完工自己的工单' })
  if (wo.status !== 'in_progress') return res.status(400).json({ error: '当前状态不能完工' })
  db.prepare("UPDATE work_orders SET status='completed', completed_at=datetime('now','localtime'), note=COALESCE(?,note) WHERE id=?")
    .run(note || null, req.params.id)
  db.prepare("UPDATE repair_orders SET status='completed' WHERE id=?").run(wo.repair_order_id)
  res.json({ message: '完工成功' })
})

router.put('/:id/reassign', auth(['cs']), (req, res) => {
  const { engineer_id, note } = req.body
  if (!engineer_id) return res.status(400).json({ error: '缺少 engineer_id' })
  const db = getDb()
  const wo = db.prepare('SELECT * FROM work_orders WHERE id=?').get(req.params.id) as any
  if (!wo) return res.status(404).json({ error: '派工单不存在' })
  if (wo.status === 'completed') return res.status(400).json({ error: '已完工的工单不能转派' })
  const eng = db.prepare('SELECT id, role FROM users WHERE id=?').get(engineer_id) as any
  if (!eng || eng.role !== 'engineer') return res.status(400).json({ error: '目标不是工程师角色' })

  db.prepare("UPDATE work_orders SET status='reassigned' WHERE id=?").run(req.params.id)

  const r = db.prepare('INSERT INTO work_orders (repair_order_id, engineer_id, status, note) VALUES (?,?,?,?)')
    .run(wo.repair_order_id, engineer_id, 'assigned', note || `转派自工单#${req.params.id}`)
  res.status(201).json({
    message: '转派成功',
    old_work_order_id: Number(req.params.id),
    old_status: 'reassigned',
    new_work_order_id: r.lastInsertRowid
  })
})

export default router
