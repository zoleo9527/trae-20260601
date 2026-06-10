import { randomUUID } from 'crypto'
import { Router, type Request, type Response } from 'express'
import db, { rowToCamel } from '../db.js'

const router = Router()

function now() {
  return new Date().toISOString().replace('T', ' ').replace(/\.\d+Z$/, '')
}

router.get('/', (req: Request, res: Response): void => {
  const { status, role } = req.query
  let sql = 'SELECT * FROM maintenance_orders WHERE 1=1'
  const params: string[] = []

  if (status) {
    sql += ' AND status = ?'
    params.push(status as string)
  }
  if (role) {
    sql += ' AND current_handler = ?'
    params.push(role as string)
  }

  sql += ' ORDER BY created_at DESC'

  const rows = db.prepare(sql).all(...params) as Record<string, unknown>[]
  res.json({ success: true, data: rows.map(rowToCamel) })
})

router.get('/:id', (req: Request, res: Response): void => {
  const order = db.prepare('SELECT * FROM maintenance_orders WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined
  if (!order) {
    res.status(404).json({ success: false, error: '工单不存在' })
    return
  }

  const timeline = db.prepare('SELECT * FROM timeline_events WHERE order_id = ? ORDER BY timestamp ASC').all(req.params.id) as Record<string, unknown>[]
  const notes = db.prepare('SELECT * FROM order_notes WHERE order_id = ? ORDER BY timestamp DESC').all(req.params.id) as Record<string, unknown>[]

  res.json({
    success: true,
    data: {
      ...rowToCamel(order),
      timeline: timeline.map(rowToCamel),
      notes: notes.map(rowToCamel),
    },
  })
})

router.post('/batch/checkin', (req: Request, res: Response): void => {
  const { ids, anomaly = false, anomalyDesc } = req.body
  if (!Array.isArray(ids) || ids.length === 0) {
    res.status(400).json({ success: false, error: '请提供工单ID列表' })
    return
  }

  const checkinTime = now()
  const results: string[] = []
  const errors: { id: string; reason: string }[] = []

  const batchCheckin = db.transaction(() => {
    for (const id of ids) {
      const order = db.prepare('SELECT status FROM maintenance_orders WHERE id = ?').get(id) as { status: string } | undefined
      if (!order) {
        errors.push({ id, reason: '工单不存在' })
        continue
      }
      if (order.status !== 'pending') {
        errors.push({ id, reason: '当前状态不允许签到' })
        continue
      }

      const anomalyInt = anomaly ? 1 : 0
      const detail = anomaly
        ? `技师已到场，发现异常：${anomalyDesc || '未描述'}`
        : '技师已到场，现场正常'

      db.prepare(`
        UPDATE maintenance_orders
        SET status = 'checked_in', current_handler = 'service', checkin_time = ?,
            checkin_anomaly = ?, checkin_anomaly_desc = ?, updated_at = ?
        WHERE id = ?
      `).run(checkinTime, anomalyInt, anomalyDesc || null, checkinTime, id)

      db.prepare(`
        INSERT INTO timeline_events (id, order_id, role, action, detail, timestamp)
        VALUES (?, ?, 'technician', '到场签到', ?, ?)
      `).run(randomUUID(), id, detail, checkinTime)

      results.push(id)
    }
  })

  batchCheckin()
  res.json({ success: true, data: { checkedIn: results, errors } })
})

router.post('/batch/review', (req: Request, res: Response): void => {
  const { ids, approved } = req.body
  if (!Array.isArray(ids) || ids.length === 0) {
    res.status(400).json({ success: false, error: '请提供工单ID列表' })
    return
  }

  const reviewTime = now()
  const results: string[] = []
  const errors: { id: string; reason: string }[] = []

  const batchReview = db.transaction(() => {
    for (const id of ids) {
      const order = db.prepare('SELECT status FROM maintenance_orders WHERE id = ?').get(id) as { status: string } | undefined
      if (!order) {
        errors.push({ id, reason: '工单不存在' })
        continue
      }
      if (order.status !== 'reviewing') {
        errors.push({ id, reason: '当前状态不允许审核' })
        continue
      }

      if (approved) {
        db.prepare(`
          UPDATE maintenance_orders SET status = 'completed', updated_at = ? WHERE id = ?
        `).run(reviewTime, id)

        db.prepare(`
          INSERT INTO timeline_events (id, order_id, role, action, detail, timestamp)
          VALUES (?, ?, 'supervisor', '审核通过', '主管审核通过，维保合格', ?)
        `).run(randomUUID(), id, reviewTime)
      } else {
        db.prepare(`
          UPDATE maintenance_orders SET status = 'rejected', current_handler = 'service', updated_at = ? WHERE id = ?
        `).run(reviewTime, id)

        db.prepare(`
          INSERT INTO timeline_events (id, order_id, role, action, detail, timestamp)
          VALUES (?, ?, 'supervisor', '审核退回', '主管审核退回，需客服重新跟进', ?)
        `).run(randomUUID(), id, reviewTime)
      }

      results.push(id)
    }
  })

  batchReview()
  res.json({ success: true, data: { reviewed: results, errors } })
})

router.post('/:id/checkin', (req: Request, res: Response): void => {
  const { id } = req.params
  const { anomaly = false, anomalyDesc } = req.body

  const order = db.prepare('SELECT status FROM maintenance_orders WHERE id = ?').get(id) as { status: string } | undefined
  if (!order) {
    res.status(404).json({ success: false, error: '工单不存在' })
    return
  }
  if (order.status !== 'pending') {
    res.status(400).json({ success: false, error: '当前状态不允许签到，仅待办工单可签到' })
    return
  }

  const checkinTime = now()
  const anomalyInt = anomaly ? 1 : 0
  const detail = anomaly
    ? `技师已到场，发现异常：${anomalyDesc || '未描述'}`
    : '技师已到场，现场正常'

  db.prepare(`
    UPDATE maintenance_orders
    SET status = 'checked_in', current_handler = 'service', checkin_time = ?,
        checkin_anomaly = ?, checkin_anomaly_desc = ?, updated_at = ?
    WHERE id = ?
  `).run(checkinTime, anomalyInt, anomalyDesc || null, checkinTime, id)

  db.prepare(`
    INSERT INTO timeline_events (id, order_id, role, action, detail, timestamp)
    VALUES (?, ?, 'technician', '到场签到', ?, ?)
  `).run(randomUUID(), id, detail, checkinTime)

  const updated = db.prepare('SELECT * FROM maintenance_orders WHERE id = ?').get(id) as Record<string, unknown>
  res.json({ success: true, data: rowToCamel(updated) })
})

router.post('/:id/note', (req: Request, res: Response): void => {
  const { id } = req.params
  const { role, content } = req.body

  if (!role || !content) {
    res.status(400).json({ success: false, error: '请提供角色和备注内容' })
    return
  }

  const order = db.prepare('SELECT id FROM maintenance_orders WHERE id = ?').get(id) as { id: string } | undefined
  if (!order) {
    res.status(404).json({ success: false, error: '工单不存在' })
    return
  }

  const timestamp = now()
  const noteId = randomUUID()

  db.prepare(`
    INSERT INTO order_notes (id, order_id, role, content, timestamp)
    VALUES (?, ?, ?, ?, ?)
  `).run(noteId, id, role, content, timestamp)


  db.prepare(`
    INSERT INTO timeline_events (id, order_id, role, action, detail, timestamp)
    VALUES (?, ?, ?, '添加备注', ?, ?)
  `).run(randomUUID(), id, role, content, timestamp)
  db.prepare(`
    UPDATE maintenance_orders SET updated_at = ? WHERE id = ?
  `).run(timestamp, id)

  res.json({
    success: true,
    data: { id: noteId, orderId: id, role, content, timestamp },
  })
})

router.post('/:id/advance', (req: Request, res: Response): void => {
  const { id } = req.params

  const order = db.prepare('SELECT status FROM maintenance_orders WHERE id = ?').get(id) as { status: string } | undefined
  if (!order) {
    res.status(404).json({ success: false, error: '工单不存在' })
    return
  }
  if (order.status !== 'checked_in') {
    res.status(400).json({ success: false, error: '当前状态不允许推进，仅已签到工单可推进审核' })
    return
  }

  const advanceTime = now()

  db.prepare(`
    UPDATE maintenance_orders SET status = 'reviewing', current_handler = 'supervisor', updated_at = ? WHERE id = ?
  `).run(advanceTime, id)

  db.prepare(`
    INSERT INTO timeline_events (id, order_id, role, action, detail, timestamp)
    VALUES (?, ?, 'service', '提交审核', '客服提交主管审核', ?)
  `).run(randomUUID(), id, advanceTime)

  const updated = db.prepare('SELECT * FROM maintenance_orders WHERE id = ?').get(id) as Record<string, unknown>
  res.json({ success: true, data: rowToCamel(updated) })
})

router.post('/:id/review', (req: Request, res: Response): void => {
  const { id } = req.params
  const { approved, role } = req.body

  if (typeof approved !== 'boolean') {
    res.status(400).json({ success: false, error: '请提供审核结果（approved: true/false）' })
    return
  }

  const order = db.prepare('SELECT status FROM maintenance_orders WHERE id = ?').get(id) as { status: string } | undefined
  if (!order) {
    res.status(404).json({ success: false, error: '工单不存在' })
    return
  }
  if (order.status !== 'reviewing') {
    res.status(400).json({ success: false, error: '当前状态不允许审核，仅审核中工单可审核' })
    return
  }

  const reviewTime = now()

  if (approved) {
    db.prepare(`
      UPDATE maintenance_orders SET status = 'completed', updated_at = ? WHERE id = ?
    `).run(reviewTime, id)

    db.prepare(`
      INSERT INTO timeline_events (id, order_id, role, action, detail, timestamp)
      VALUES (?, ?, 'supervisor', '审核通过', '主管审核通过，维保合格', ?)
    `).run(randomUUID(), id, reviewTime)
  } else {
    db.prepare(`
      UPDATE maintenance_orders SET status = 'rejected', current_handler = 'service', updated_at = ? WHERE id = ?
    `).run(reviewTime, id)

    db.prepare(`
      INSERT INTO timeline_events (id, order_id, role, action, detail, timestamp)
      VALUES (?, ?, 'supervisor', '审核退回', '主管审核退回，需客服重新跟进', ?)
    `).run(randomUUID(), id, reviewTime)
  }

  const updated = db.prepare('SELECT * FROM maintenance_orders WHERE id = ?').get(id) as Record<string, unknown>
  res.json({ success: true, data: rowToCamel(updated) })
})

export default router
