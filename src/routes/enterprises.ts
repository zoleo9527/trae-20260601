import { Router } from 'express'
import { auth } from '../auth'
import { getDb } from '../db'

const router = Router()

router.get('/', auth(['cs', 'supervisor']), (req, res) => {
  const db = getDb()
  const list = db.prepare('SELECT * FROM enterprises ORDER BY id').all()
  res.json(list)
})

router.get('/:id', auth(['cs', 'supervisor', 'gate']), (req, res) => {
  const db = getDb()
  const row = db.prepare('SELECT * FROM enterprises WHERE id = ?').get(req.params.id)
  if (!row) return res.status(404).json({ error: '企业不存在' })
  res.json(row)
})

router.post('/', auth(['cs']), (req, res) => {
  const { name, contact_name, contact_phone, floor } = req.body
  if (!name || !contact_name || !contact_phone || !floor) {
    return res.status(400).json({ error: '缺少必填字段' })
  }
  const db = getDb()
  const r = db.prepare('INSERT INTO enterprises (name, contact_name, contact_phone, floor) VALUES (?,?,?,?)').run(name, contact_name, contact_phone, floor)
  res.status(201).json({ id: r.lastInsertRowid, name, contact_name, contact_phone, floor })
})

router.put('/:id', auth(['cs']), (req, res) => {
  const { name, contact_name, contact_phone, floor } = req.body
  const db = getDb()
  const existing = db.prepare('SELECT id FROM enterprises WHERE id = ?').get(req.params.id)
  if (!existing) return res.status(404).json({ error: '企业不存在' })
  db.prepare('UPDATE enterprises SET name=COALESCE(?,name), contact_name=COALESCE(?,contact_name), contact_phone=COALESCE(?,contact_phone), floor=COALESCE(?,floor) WHERE id=?')
    .run(name || null, contact_name || null, contact_phone || null, floor || null, req.params.id)
  res.json({ message: '更新成功' })
})

export default router
