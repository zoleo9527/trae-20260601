import { Router, type Request, type Response } from 'express'
import db from '../db.js'

const router = Router()

router.get('/', (req: Request, res: Response) => {
  const { plate } = req.query
  let sql = `
    SELECT v.*, c.name as customer_name, c.phone as customer_phone, c.level as customer_level
    FROM vehicles v
    JOIN customers c ON c.id = v.customer_id
  `
  const params: string[] = []
  if (plate) {
    sql += ` WHERE v.plate LIKE ?`
    params.push(`%${plate}%`)
  }
  sql += ` ORDER BY v.created_at DESC`

  const vehicles = db.prepare(sql).all(...params)
  res.json({ success: true, data: vehicles })
})

router.get('/:id', (req: Request, res: Response) => {
  const vehicle = db.prepare(`
    SELECT v.*, c.name as customer_name, c.phone as customer_phone, c.level as customer_level
    FROM vehicles v
    JOIN customers c ON c.id = v.customer_id
    WHERE v.id = ?
  `).get(req.params.id)

  if (!vehicle) {
    return res.status(404).json({ success: false, error: '车辆不存在' })
  }

  res.json({ success: true, data: vehicle })
})

router.post('/', (req: Request, res: Response) => {
  const { customer_id, plate, brand, model, color } = req.body
  if (!customer_id || !plate) {
    return res.status(400).json({ success: false, error: '客户ID和车牌号不能为空' })
  }

  const customer = db.prepare('SELECT id FROM customers WHERE id = ?').get(customer_id)
  if (!customer) {
    return res.status(400).json({ success: false, error: '客户不存在' })
  }

  const existing = db.prepare('SELECT id FROM vehicles WHERE plate = ?').get(plate)
  if (existing) {
    return res.status(400).json({ success: false, error: '车牌号已存在' })
  }

  const result = db.prepare(
    'INSERT INTO vehicles (customer_id, plate, brand, model, color) VALUES (?, ?, ?, ?, ?)'
  ).run(customer_id, plate, brand || null, model || null, color || null)

  const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(result.lastInsertRowid)
  res.status(201).json({ success: true, data: vehicle })
})

export default router
