import { Router } from 'express'
import { auth } from '../auth'
import { getDb } from '../db'

const router = Router()

router.get('/', auth(['cs', 'supervisor', 'gate']), (req, res) => {
  const db = getDb()
  const { enterprise_id } = req.query
  let list: any[]
  if (enterprise_id) {
    list = db.prepare('SELECT * FROM employees WHERE enterprise_id = ? ORDER BY id').all(enterprise_id)
  } else {
    list = db.prepare('SELECT * FROM employees ORDER BY id').all()
  }
  res.json(list)
})

router.get('/:id', auth(['cs', 'supervisor', 'gate']), (req, res) => {
  const db = getDb()
  const row = db.prepare('SELECT * FROM employees WHERE id = ?').get(req.params.id)
  if (!row) return res.status(404).json({ error: '员工不存在' })
  res.json(row)
})

router.post('/', auth(['cs']), (req, res) => {
  const { enterprise_id, name, phone, position } = req.body
  if (!enterprise_id || !name || !phone || !position) {
    return res.status(400).json({ error: '缺少必填字段' })
  }
  const db = getDb()
  const ent = db.prepare('SELECT id FROM enterprises WHERE id = ?').get(enterprise_id)
  if (!ent) return res.status(400).json({ error: '企业不存在' })
  const r = db.prepare('INSERT INTO employees (enterprise_id, name, phone, position) VALUES (?,?,?,?)').run(enterprise_id, name, phone, position)
  res.status(201).json({ id: r.lastInsertRowid, enterprise_id, name, phone, position })
})

export default router
