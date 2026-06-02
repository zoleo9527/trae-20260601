import { Router, type Request, type Response } from 'express'
import db from '../db.js'

const router = Router()

router.get('/', (req: Request, res: Response) => {
  const { search } = req.query
  let sql = `
    SELECT c.*, COUNT(DISTINCT v.id) as vehicle_count
    FROM customers c
    LEFT JOIN vehicles v ON v.customer_id = c.id
  `
  const params: string[] = []
  if (search) {
    sql += ` WHERE c.name LIKE ? OR c.phone LIKE ?`
    params.push(`%${search}%`, `%${search}%`)
  }
  sql += ` GROUP BY c.id ORDER BY c.created_at DESC`

  const customers = db.prepare(sql).all(...params)
  res.json({ success: true, data: customers })
})

router.get('/:id', (req: Request, res: Response) => {
  const { id } = req.params

  const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(id) as any
  if (!customer) {
    return res.status(404).json({ success: false, error: '客户不存在' })
  }

  const vehicles = db.prepare(
    'SELECT * FROM vehicles WHERE customer_id = ?'
  ).all(id)

  const packages = db.prepare(`
    SELECT cp.*, pt.name as package_name, pt.price as package_price, pt.validity_days
    FROM customer_packages cp
    JOIN package_templates pt ON pt.id = cp.package_template_id
    WHERE cp.customer_id = ?
    ORDER BY cp.purchased_at DESC
  `).all(id)

  const recentOrders = db.prepare(`
    SELECT o.*, v.plate, v.brand, v.model, e.name as employee_name
    FROM orders o
    JOIN vehicles v ON v.id = o.vehicle_id
    LEFT JOIN employees e ON e.id = o.employee_id
    WHERE o.customer_id = ?
    ORDER BY o.created_at DESC
    LIMIT 10
  `).all(id)

  res.json({
    success: true,
    data: { ...customer, vehicles, packages, recentOrders },
  })
})

router.post('/', (req: Request, res: Response) => {
  const { name, phone, level, notes } = req.body
  if (!name) {
    return res.status(400).json({ success: false, error: '客户姓名不能为空' })
  }

  const result = db.prepare(
    'INSERT INTO customers (name, phone, level, notes) VALUES (?, ?, ?, ?)'
  ).run(name, phone || null, level || 'normal', notes || null)

  const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(result.lastInsertRowid)
  res.status(201).json({ success: true, data: customer })
})

export default router
