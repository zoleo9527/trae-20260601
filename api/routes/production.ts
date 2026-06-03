import { Router, type Request, type Response } from 'express'
import { randomUUID } from 'crypto'
import { getDb } from '../db.js'

const router = Router()

router.get('/board', (_req: Request, res: Response) => {
  const db = getDb()

  const orders = db.prepare(`
    SELECT o.*,
      (SELECT json_group_array(json_object(
        'id', a.id, 'type', a.type, 'description', a.description,
        'detectedAt', a.detected_at, 'resolvedAt', a.resolved_at, 'resolvedBy', a.resolved_by
      )) FROM anomalies a WHERE a.order_id = o.id AND a.resolved_at IS NULL) as anomalies
    FROM orders o
    WHERE o.status != 'pending' OR (o.status = 'pending' AND o.current_stage = 'production')
    ORDER BY o.delivery_date ASC, o.priority DESC
  `).all() as Array<Record<string, unknown>>

  const grouped = new Map<string, unknown[]>()

  for (const order of orders) {
    const date = order.delivery_date as string
    if (!grouped.has(date)) {
      grouped.set(date, [])
    }

    let parsedAnomalies: unknown[] = []
    try {
      const raw = order.anomalies as string
      parsedAnomalies = raw && raw !== '[null]' ? JSON.parse(raw) : []
    } catch {
      parsedAnomalies = []
    }

    grouped.get(date)!.push({
      id: order.id,
      orderNo: order.order_no,
      customerName: order.customer_name,
      patientName: order.patient_name,
      productType: order.product_type,
      currentStage: order.current_stage,
      currentHandler: order.current_handler,
      priority: order.priority,
      deliveryDate: order.delivery_date,
      status: order.status,
      timeInStage: order.time_in_stage,
      anomalies: parsedAnomalies,
    })
  }

  const board = Array.from(grouped.entries()).map(([date, items]) => ({
    date,
    count: items.length,
    orders: items,
  }))

  res.json({ success: true, data: board })
})

router.patch('/schedule', (req: Request, res: Response) => {
  const db = getDb()
  const { orderId, deliveryDate, productionLine } = req.body

  if (!orderId) {
    res.status(400).json({ success: false, error: '缺少 orderId' })
    return
  }

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as {
    id: string
    order_no: string
    current_stage: string
    status: string
  } | undefined

  if (!order) {
    res.status(404).json({ success: false, error: '工单不存在' })
    return
  }

  const hasAnomaly = db.prepare(
    "SELECT COUNT(*) as cnt FROM anomalies WHERE order_id = ? AND resolved_at IS NULL"
  ).get(orderId) as { cnt: number }

  if (hasAnomaly.cnt > 0) {
    res.status(400).json({ success: false, error: '存在未解决异常，无法调整排产' })
    return
  }

  const updates: string[] = []
  const params: unknown[] = []

  if (deliveryDate !== undefined) {
    updates.push('delivery_date = ?')
    params.push(deliveryDate)
  }

  if (updates.length === 0) {
    res.status(400).json({ success: false, error: '没有可更新的字段' })
    return
  }

  updates.push("updated_at = datetime('now')")
  params.push(orderId)

  db.prepare(`UPDATE orders SET ${updates.join(', ')} WHERE id = ?`).run(...params)

  if (productionLine) {
    const existingSchedule = db.prepare(
      "SELECT * FROM handoff_records WHERE order_id = ? AND action = 'schedule' ORDER BY created_at DESC LIMIT 1"
    ).get(orderId) as { id: string; details: string } | undefined

    if (existingSchedule) {
      const existingDetails = JSON.parse(existingSchedule.details || '{}')
      existingDetails.production = {
        ...existingDetails.production,
        productionLine,
        estimatedCompletion: deliveryDate
          ? `${deliveryDate} 18:00:00`
          : existingDetails.production?.estimatedCompletion,
      }
      db.prepare('UPDATE handoff_records SET details = ? WHERE id = ?').run(
        JSON.stringify(existingDetails),
        existingSchedule.id,
      )
    } else {
      db.prepare(`
        INSERT INTO handoff_records (id, order_id, from_role, to_role, action, reason, details, created_at)
        VALUES (?, ?, 'inspector', 'production', 'schedule', ?, ?, datetime('now'))
      `).run(
        randomUUID(),
        orderId,
        `排产更新：产线${productionLine}`,
        JSON.stringify({
          production: {
            productionLine,
            estimatedCompletion: deliveryDate ? `${deliveryDate} 18:00:00` : null,
            splitFrom: null,
          },
        }),
      )
    }
  }

  const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as Record<string, unknown>

  res.json({
    success: true,
    data: {
      id: updated.id,
      orderNo: updated.order_no,
      deliveryDate: updated.delivery_date,
      updatedAt: updated.updated_at,
    },
  })
})

export default router
