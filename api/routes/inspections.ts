import { Router, type Request, type Response } from 'express'
import db from '../db.js'

const router = Router()

router.get('/', (req: Request, res: Response) => {
  const { status } = req.query

  if (status === 'pending') {
    const orders = db.prepare(`
      SELECT o.*, c.name as customer_name, c.phone as customer_phone, c.level as customer_level,
             v.plate, v.brand, v.model, v.color,
             e.name as employee_name,
             last_inspection.result as last_inspection_result
      FROM orders o
      JOIN customers c ON c.id = o.customer_id
      JOIN vehicles v ON v.id = o.vehicle_id
      LEFT JOIN employees e ON e.id = o.employee_id
      LEFT JOIN (
        SELECT order_id, result, created_at,
               ROW_NUMBER() OVER (PARTITION BY order_id ORDER BY created_at DESC) as rn
        FROM inspections
      ) last_inspection ON last_inspection.order_id = o.id AND last_inspection.rn = 1
      WHERE o.status = 'completed'
        AND (last_inspection.result IS NULL OR last_inspection.result != 'pass')
      ORDER BY o.created_at DESC
    `).all() as any[]

    const orderIds = orders.map(o => o.id)
    const itemsMap = new Map()
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
    }

    for (const order of orders) {
      order.items = itemsMap.get(order.id) || []
    }

    res.json({ success: true, data: orders })
  } else if (status === 'completed') {
    const orders = db.prepare(`
      SELECT o.*, c.name as customer_name, c.phone as customer_phone, c.level as customer_level,
             v.plate, v.brand, v.model, v.color,
             e.name as employee_name,
             last_pass.created_at as inspected_at,
             insp.name as inspector_name,
             last_inspection.result as last_inspection_result
      FROM orders o
      JOIN customers c ON c.id = o.customer_id
      JOIN vehicles v ON v.id = o.vehicle_id
      LEFT JOIN employees e ON e.id = o.employee_id
      JOIN (
        SELECT order_id, inspector_id, created_at,
               ROW_NUMBER() OVER (PARTITION BY order_id ORDER BY created_at DESC) as rn
        FROM inspections
        WHERE result = 'pass'
      ) last_pass ON last_pass.order_id = o.id AND last_pass.rn = 1
      JOIN employees insp ON insp.id = last_pass.inspector_id
      LEFT JOIN (
        SELECT order_id, result, created_at,
               ROW_NUMBER() OVER (PARTITION BY order_id ORDER BY created_at DESC) as rn
        FROM inspections
      ) last_inspection ON last_inspection.order_id = o.id AND last_inspection.rn = 1
      WHERE last_inspection.result = 'pass'
        AND o.status = 'completed'
      ORDER BY last_pass.created_at DESC
    `).all() as any[]

    const orderIds = orders.map(o => o.id)
    const itemsMap = new Map()
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
    }

    for (const order of orders) {
      order.items = itemsMap.get(order.id) || []
    }

    res.json({ success: true, data: orders })
  } else {
    let sql = `
      SELECT i.*, o.status as order_status, o.customer_id, o.vehicle_id,
             c.name as customer_name, v.plate, e.name as inspector_name
      FROM inspections i
      JOIN orders o ON o.id = i.order_id
      JOIN customers c ON c.id = o.customer_id
      JOIN vehicles v ON v.id = o.vehicle_id
      JOIN employees e ON e.id = i.inspector_id
      WHERE 1=1
    `
    const params: string[] = []

    if (status === 'rework') {
      sql += ` AND i.result = 'rework'`
    }
    sql += ` ORDER BY i.created_at DESC`

    const inspections = db.prepare(sql).all(...params)
    res.json({ success: true, data: inspections })
  }
})

router.post('/', (req: Request, res: Response) => {
  const { order_id, inspector_id, result, reason } = req.body

  if (!order_id || !inspector_id || !result) {
    return res.status(400).json({ success: false, error: '工单ID、质检员ID和结果不能为空' })
  }

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(order_id) as any
  if (!order) {
    return res.status(404).json({ success: false, error: '工单不存在' })
  }

  const tx = db.transaction(() => {
    db.prepare(
      'INSERT INTO inspections (order_id, inspector_id, result, reason) VALUES (?, ?, ?, ?)'
    ).run(order_id, inspector_id, result, reason || null)

    if (result === 'pass') {
      db.prepare("UPDATE orders SET status = 'completed', completed_at = datetime('now', 'localtime') WHERE id = ?")
        .run(order_id)

      if (order.is_rework) {
        const orderItems = db.prepare(
          'SELECT * FROM order_items WHERE order_id = ?'
        ).all(order_id)

        for (const item of orderItems as any[]) {
          if (item.customer_package_id) {
            const pkg = db.prepare(
              'SELECT * FROM customer_packages WHERE id = ?'
            ).get(item.customer_package_id) as any

            if (pkg && pkg.remaining_count > 0) {
              db.prepare(
                'UPDATE customer_packages SET remaining_count = remaining_count - 1 WHERE id = ?'
              ).run(item.customer_package_id)

              db.prepare(
                "INSERT INTO deduction_records (customer_package_id, order_item_id, type, count, service_type, reason) VALUES (?, ?, 'usage', 1, ?, '返工重做扣次')"
              ).run(item.customer_package_id, item.id, item.service_type)
            }
          }
        }
      }
    } else if (result === 'rework') {
      db.prepare("UPDATE orders SET status = 'rework' WHERE id = ?").run(order_id)

      const reworkOrder = db.prepare(
        'INSERT INTO orders (customer_id, vehicle_id, employee_id, status, total_amount, is_rework, original_order_id) VALUES (?, ?, ?, ?, 0, 1, ?)'
      ).run(order.customer_id, order.vehicle_id, order.employee_id, 'pending', order_id)

      const orderItems = db.prepare(
        'SELECT * FROM order_items WHERE order_id = ?'
      ).all(order_id)

      const insertItem = db.prepare(
        'INSERT INTO order_items (order_id, customer_package_id, service_type, price) VALUES (?, ?, ?, 0)'
      )

      for (const item of orderItems as any[]) {
        insertItem.run(reworkOrder.lastInsertRowid, item.customer_package_id, item.service_type)
      }

      for (const item of orderItems as any[]) {
        if (item.customer_package_id) {
          db.prepare(
            "INSERT INTO deduction_records (customer_package_id, order_item_id, type, count, service_type, reason) VALUES (?, ?, 'rework_refund', 1, ?, '质检返工退还')"
          ).run(item.customer_package_id, item.id, item.service_type)

          db.prepare(
            'UPDATE customer_packages SET remaining_count = remaining_count + 1 WHERE id = ?'
          ).run(item.customer_package_id)
        }
      }

      return { reworkOrderId: reworkOrder.lastInsertRowid }
    }

    return {}
  })

  try {
    const extra = tx()
    const inspection = db.prepare(
      'SELECT * FROM inspections WHERE order_id = ? ORDER BY created_at DESC LIMIT 1'
    ).get(order_id) as any
    res.status(201).json({ success: true, data: { ...inspection, ...extra } })
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message })
  }
})

router.post('/:id/rework', (req: Request, res: Response) => {
  const { id } = req.params
  const { reason } = req.body

  const inspection = db.prepare('SELECT * FROM inspections WHERE id = ?').get(id) as any
  if (!inspection) {
    return res.status(404).json({ success: false, error: '质检记录不存在' })
  }

  db.prepare("UPDATE inspections SET result = 'rework', reason = ? WHERE id = ?")
    .run(reason || null, id)

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(inspection.order_id) as any
  if (order) {
    db.prepare("UPDATE orders SET status = 'rework' WHERE id = ?").run(inspection.order_id)
  }

  const updated = db.prepare('SELECT * FROM inspections WHERE id = ?').get(id)
  res.json({ success: true, data: updated })
})

router.post('/compensate', (req: Request, res: Response) => {
  const { customer_package_id, count, reason, service_type } = req.body

  if (!customer_package_id || !count || !reason || !service_type) {
    return res.status(400).json({ success: false, error: '套餐ID、次数、原因和服务类型不能为空' })
  }

  const pkg = db.prepare('SELECT * FROM customer_packages WHERE id = ?').get(customer_package_id) as any
  if (!pkg) {
    return res.status(404).json({ success: false, error: '客户套餐不存在' })
  }

  const packageItem = db.prepare(
    'SELECT * FROM package_items WHERE package_template_id = ? AND service_type = ?'
  ).get(pkg.package_template_id, service_type)

  if (!packageItem) {
    return res.status(400).json({ success: false, error: `套餐不包含该服务类型: ${service_type}` })
  }

  const tx = db.transaction(() => {
    db.prepare(
      'UPDATE customer_packages SET remaining_count = remaining_count + ? WHERE id = ?'
    ).run(count, customer_package_id)

    db.prepare(
      "INSERT INTO deduction_records (customer_package_id, type, count, service_type, reason) VALUES (?, 'compensation', ?, ?, ?)"
    ).run(customer_package_id, count, service_type, reason)
  })

  try {
    tx()
    const updated = db.prepare('SELECT * FROM customer_packages WHERE id = ?').get(customer_package_id)
    res.json({ success: true, data: updated })
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message })
  }
})

export default router
