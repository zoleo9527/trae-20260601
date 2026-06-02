import { Router, type Request, type Response } from 'express'
import db from '../db.js'

const router = Router()

router.get('/', (_req: Request, res: Response) => {
  const templates = db.prepare(`
    SELECT pt.*, GROUP_CONCAT(pi.service_type || ':' || pi.count) as items_summary
    FROM package_templates pt
    LEFT JOIN package_items pi ON pi.package_template_id = pt.id
    GROUP BY pt.id
    ORDER BY pt.price
  `).all()

  const result = templates.map((t: any) => {
    const items = db.prepare(
      'SELECT * FROM package_items WHERE package_template_id = ?'
    ).all(t.id)
    return { ...t, items }
  })

  res.json({ success: true, data: result })
})

router.get('/customer/:customerId', (req: Request, res: Response) => {
  const { customerId } = req.params

  const packages = db.prepare(`
    SELECT cp.*, pt.name as package_name, pt.price as package_price,
           pt.validity_days, pt.description as package_description
    FROM customer_packages cp
    JOIN package_templates pt ON pt.id = cp.package_template_id
    WHERE cp.customer_id = ?
    ORDER BY cp.purchased_at DESC
  `).all(customerId)

  const result = packages.map((pkg: any) => {
    const items = db.prepare(
      'SELECT * FROM package_items WHERE package_template_id = ?'
    ).all(pkg.package_template_id)

    const deductions = db.prepare(
      "SELECT service_type, SUM(count) as used_count FROM deduction_records WHERE customer_package_id = ? AND type = 'usage' GROUP BY service_type"
    ).all(pkg.id) as any[]

    const usageMap: Record<string, number> = {}
    for (const d of deductions) {
      usageMap[d.service_type] = d.used_count
    }

    const itemDetails = items.map((item: any) => ({
      service_type: item.service_type,
      total: item.count,
      used: usageMap[item.service_type] || 0,
      remaining: item.count - (usageMap[item.service_type] || 0),
    }))

    const isLow = pkg.remaining_count <= 2
    const isExpiring = new Date(pkg.expires_at) < new Date(Date.now() + 30 * 86400000)

    return {
      ...pkg,
      items: itemDetails,
      isLow,
      isExpiring,
    }
  })

  res.json({ success: true, data: result })
})

router.post('/', (req: Request, res: Response) => {
  const { customer_id, package_template_id } = req.body
  if (!customer_id || !package_template_id) {
    return res.status(400).json({ success: false, error: '客户ID和套餐ID不能为空' })
  }

  const template = db.prepare('SELECT * FROM package_templates WHERE id = ?').get(package_template_id) as any
  if (!template) {
    return res.status(400).json({ success: false, error: '套餐不存在' })
  }

  const items = db.prepare(
    'SELECT * FROM package_items WHERE package_template_id = ?'
  ).all(package_template_id)

  const totalCount = items.reduce((sum: number, item: any) => sum + item.count, 0)
  const expiresAt = new Date(Date.now() + template.validity_days * 86400000)
    .toISOString().replace('T', ' ').slice(0, 19)

  const result = db.prepare(
    'INSERT INTO customer_packages (customer_id, package_template_id, total_count, remaining_count, expires_at) VALUES (?, ?, ?, ?, ?)'
  ).run(customer_id, package_template_id, totalCount, totalCount, expiresAt)

  const pkg = db.prepare('SELECT * FROM customer_packages WHERE id = ?').get(result.lastInsertRowid)
  res.status(201).json({ success: true, data: pkg })
})

router.put('/:id/deduct', (req: Request, res: Response) => {
  const { id } = req.params
  const { count, type, reason, orderItemId, service_type } = req.body

  if (!count || !type) {
    return res.status(400).json({ success: false, error: '扣减次数和类型不能为空' })
  }

  const pkg = db.prepare('SELECT * FROM customer_packages WHERE id = ?').get(id) as any
  if (!pkg) {
    return res.status(404).json({ success: false, error: '客户套餐不存在' })
  }

  if (type === 'usage' && pkg.remaining_count < count) {
    return res.status(400).json({ success: false, error: '剩余次数不足' })
  }

  const tx = db.transaction(() => {
    const delta = type === 'usage' ? -count : count
    db.prepare(
      'UPDATE customer_packages SET remaining_count = remaining_count + ? WHERE id = ?'
    ).run(delta, id)

    db.prepare(
      'INSERT INTO deduction_records (customer_package_id, order_item_id, type, count, service_type, reason) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(id, orderItemId || null, type, count, service_type || null, reason || null)
  })

  tx()

  const updated = db.prepare('SELECT * FROM customer_packages WHERE id = ?').get(id)
  res.json({ success: true, data: updated })
})

export default router
