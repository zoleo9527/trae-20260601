import { Router, type Request, type Response } from 'express'
import db from '../db.js'

const router = Router()

router.get('/', (req: Request, res: Response) => {
  const { date, status } = req.query
  let sql = `
    SELECT o.*, c.name as customer_name, c.phone as customer_phone, c.level as customer_level,
           v.plate, v.brand, v.model, v.color, e.name as employee_name,
           EXISTS (
             SELECT 1 FROM inspections i
             WHERE i.order_id = o.id AND i.result = 'pass'
           ) as has_passed_inspection
    FROM orders o
    JOIN customers c ON c.id = o.customer_id
    JOIN vehicles v ON v.id = o.vehicle_id
    LEFT JOIN employees e ON e.id = o.employee_id
    WHERE 1=1
  `
  const params: any[] = []

  if (date === 'today') {
    sql += ` AND date(o.created_at) = date('now', 'localtime')`
  } else if (date) {
    sql += ` AND date(o.created_at) = date(?)`
    params.push(date)
  }

  if (status) {
    sql += ` AND o.status = ?`
    params.push(status)
  }

  sql += ` ORDER BY o.created_at DESC`

  const orders = db.prepare(sql).all(...params) as any[]

  const orderIds = orders.map(o => o.id)
  const itemsMap = new Map()
  const inspectionsMap = new Map()

  if (orderIds.length > 0) {
    const placeholders = orderIds.map(() => '?').join(',')

    const items = db.prepare(`
      SELECT oi.*, pt.name as package_name
      FROM order_items oi
      LEFT JOIN package_templates pt ON pt.id = oi.package_template_id
      WHERE oi.order_id IN (${placeholders})
    `).all(...orderIds) as any[]

    for (const item of items) {
      if (!itemsMap.has(item.order_id)) {
        itemsMap.set(item.order_id, [])
      }
      itemsMap.get(item.order_id).push(item)
    }

    const inspections = db.prepare(`
      SELECT i.*, e.name as inspector_name
      FROM inspections i
      JOIN employees e ON e.id = i.inspector_id
      WHERE i.order_id IN (${placeholders})
      ORDER BY i.created_at
    `).all(...orderIds) as any[]

    for (const ins of inspections) {
      if (!inspectionsMap.has(ins.order_id)) {
        inspectionsMap.set(ins.order_id, [])
      }
      inspectionsMap.get(ins.order_id).push(ins)
    }
  }

  for (const order of orders) {
    order.items = itemsMap.get(order.id) || []
    order.inspections = inspectionsMap.get(order.id) || []
  }

  res.json({ success: true, data: orders })
})

router.get('/:id', (req: Request, res: Response) => {
  const order = db.prepare(`
    SELECT o.*, c.name as customer_name, c.phone as customer_phone, c.level as customer_level,
           v.plate, v.brand, v.model, v.color, e.name as employee_name
    FROM orders o
    JOIN customers c ON c.id = o.customer_id
    JOIN vehicles v ON v.id = o.vehicle_id
    LEFT JOIN employees e ON e.id = o.employee_id
    WHERE o.id = ?
  `).get(req.params.id) as any

  if (!order) {
    return res.status(404).json({ success: false, error: '工单不存在' })
  }

  const items = db.prepare(`
    SELECT oi.*, cp.package_template_id, pt.name as package_name
    FROM order_items oi
    LEFT JOIN customer_packages cp ON cp.id = oi.customer_package_id
    LEFT JOIN package_templates pt ON pt.id = cp.package_template_id
    WHERE oi.order_id = ?
  `).all(req.params.id)

  const inspections = db.prepare(`
    SELECT i.*, e.name as inspector_name
    FROM inspections i
    JOIN employees e ON e.id = i.inspector_id
    WHERE i.order_id = ?
    ORDER BY i.created_at
  `).all(req.params.id)

  res.json({ success: true, data: { ...order, items, inspections } })
})

router.post('/', (req: Request, res: Response) => {
  const { customer_id, vehicle_id, employee_id, items } = req.body
  if (!customer_id || !vehicle_id || !items?.length) {
    return res.status(400).json({ success: false, error: '客户、车辆和服务项目不能为空' })
  }

  const tx = db.transaction(() => {
    let totalAmount = 0

    const enrichedItems = items.map((item: any) => {
      if (item.customer_package_id) {
        const pkg = db.prepare(
          'SELECT * FROM customer_packages WHERE id = ?'
        ).get(item.customer_package_id) as any

        if (!pkg || pkg.remaining_count <= 0) {
          throw new Error(`套餐次数不足: ${item.customer_package_id}`)
        }

        const templateItems = db.prepare(
          "SELECT * FROM package_items WHERE package_template_id = ? AND service_type = ?"
        ).get(pkg.package_template_id, item.service_type)

        if (!templateItems) {
          throw new Error(`套餐不包含该服务: ${item.service_type}`)
        }

        db.prepare(
          'UPDATE customer_packages SET remaining_count = remaining_count - 1 WHERE id = ?'
        ).run(item.customer_package_id)

        db.prepare(
          "INSERT INTO deduction_records (customer_package_id, type, count, service_type, reason) VALUES (?, 'usage', 1, ?, '下单扣次')"
        ).run(item.customer_package_id, item.service_type)

        return { ...item, price: 0 }
      }

      const prices: Record<string, number> = { 镀膜: 680, 精洗: 80, 打蜡: 380, 抛光: 580 }
      const price = item.price ?? prices[item.service_type] ?? 0
      totalAmount += price
      return { ...item, price }
    })

    const orderResult = db.prepare(
      'INSERT INTO orders (customer_id, vehicle_id, employee_id, status, total_amount) VALUES (?, ?, ?, ?, ?)'
    ).run(customer_id, vehicle_id, employee_id || null, employee_id ? 'in_progress' : 'pending', totalAmount)

    const orderId = orderResult.lastInsertRowid

    const insertItem = db.prepare(
      'INSERT INTO order_items (order_id, customer_package_id, service_type, price) VALUES (?, ?, ?, ?)'
    )

    for (const item of enrichedItems) {
      const itemResult = insertItem.run(orderId, item.customer_package_id || null, item.service_type, item.price)
      if (item.customer_package_id) {
        db.prepare(
          "UPDATE deduction_records SET order_item_id = ? WHERE customer_package_id = ? AND type = 'usage' AND order_item_id IS NULL AND service_type = ? LIMIT 1"
        ).run(itemResult.lastInsertRowid, item.customer_package_id, item.service_type)
      }
    }

    return db.prepare(`
      SELECT o.*, c.name as customer_name, v.plate, v.brand, v.model
      FROM orders o
      JOIN customers c ON c.id = o.customer_id
      JOIN vehicles v ON v.id = o.vehicle_id
      WHERE o.id = ?
    `).get(orderId)
  })

  try {
    const order = tx()
    res.status(201).json({ success: true, data: order })
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message })
  }
})

router.put('/:id/status', (req: Request, res: Response) => {
  const { id } = req.params
  const { status } = req.body

  const validStatuses = ['pending', 'in_progress', 'completed', 'rework']
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, error: '无效的状态' })
  }

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id)
  if (!order) {
    return res.status(404).json({ success: false, error: '工单不存在' })
  }

  const completedAt = status === 'completed' ? new Date().toISOString().replace('T', ' ').slice(0, 19) : null

  db.prepare(
    'UPDATE orders SET status = ?, completed_at = COALESCE(?, completed_at) WHERE id = ?'
  ).run(status, completedAt, id)

  const updated = db.prepare(`
    SELECT o.*, c.name as customer_name, v.plate
    FROM orders o
    JOIN customers c ON c.id = o.customer_id
    JOIN vehicles v ON v.id = o.vehicle_id
    WHERE o.id = ?
  `).get(id)

  res.json({ success: true, data: updated })
})

router.put('/:id/assign', (req: Request, res: Response) => {
  const { id } = req.params
  const { employee_id } = req.body

  if (!employee_id) {
    return res.status(400).json({ success: false, error: '技师ID不能为空' })
  }

  const employee = db.prepare("SELECT * FROM employees WHERE id = ? AND role = 'technician'").get(employee_id)
  if (!employee) {
    return res.status(400).json({ success: false, error: '技师不存在' })
  }

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id)
  if (!order) {
    return res.status(404).json({ success: false, error: '工单不存在' })
  }

  db.prepare('UPDATE orders SET employee_id = ?, status = ? WHERE id = ?')
    .run(employee_id, 'in_progress', id)

  const updated = db.prepare(`
    SELECT o.*, c.name as customer_name, v.plate, e.name as employee_name
    FROM orders o
    JOIN customers c ON c.id = o.customer_id
    JOIN vehicles v ON v.id = o.vehicle_id
    JOIN employees e ON e.id = o.employee_id
    WHERE o.id = ?
  `).get(id)

  res.json({ success: true, data: updated })
})

export default router
