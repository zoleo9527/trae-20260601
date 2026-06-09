import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import db from '../db.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  try {
    const rows = db.prepare(`
      SELECT o.*, c.customer_name, c.yard_position, c.type as container_type
      FROM overstay_records o
      LEFT JOIN containers c ON o.container_id = c.id
      ORDER BY o.created_at DESC
    `).all()
    res.json({ success: true, data: rows })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.patch('/:id/status', (req: Request, res: Response): void => {
  try {
    const record = db.prepare('SELECT * FROM overstay_records WHERE id = ?').get(req.params.id) as any
    if (!record) {
      res.status(404).json({ success: false, error: 'Overstay record not found' })
      return
    }
    const { status, operator_name, role } = req.body
    const prevStatus = record.status

    const transaction = db.transaction(() => {
      db.prepare("UPDATE overstay_records SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, req.params.id)

      if (status === 'closed') {
        db.prepare("UPDATE overstay_records SET closed_at = datetime('now') WHERE id = ?").run(req.params.id)
      }

      if (status === 'processing') {
        db.prepare("UPDATE containers SET status = 'overstay', updated_at = datetime('now') WHERE id = ?").run(record.container_id)
        const slot = db.prepare('SELECT id FROM yard_slots WHERE container_id = ?').get(record.container_id) as any
        if (slot) {
          db.prepare("UPDATE yard_slots SET status = 'overstay' WHERE id = ?").run(slot.id)
        }
      }

      if (status === 'closed') {
        const container = db.prepare('SELECT * FROM containers WHERE id = ?').get(record.container_id) as any
        if (container && container.overstay_days > 0) {
          db.prepare("UPDATE containers SET status = 'normal', updated_at = datetime('now') WHERE id = ?").run(record.container_id)
          const slot = db.prepare('SELECT id FROM yard_slots WHERE container_id = ?').get(record.container_id) as any
          if (slot) {
            db.prepare("UPDATE yard_slots SET status = 'occupied' WHERE id = ?").run(slot.id)
          }
        }
      }

      const statusLabels: Record<string, string> = {
        pending_notify: '待通知', notified: '已通知', processing: '处理中', closed: '已结案',
      }
      db.prepare(`
        INSERT INTO timeline_events (id, container_id, event_type, operator_name, role, description, metadata)
        VALUES (?, ?, 'overstay_status_change', ?, ?, ?, ?)
      `).run(
        uuidv4(),
        record.container_id,
        operator_name || 'system',
        role || 'system',
        `超期记录状态变更：${statusLabels[prevStatus] || prevStatus} → ${statusLabels[status] || status}`,
        JSON.stringify({ overstay_id: req.params.id, from: prevStatus, to: status })
      )
    })

    transaction()
    const row = db.prepare(`
      SELECT o.*, c.customer_name, c.yard_position
      FROM overstay_records o
      LEFT JOIN containers c ON o.container_id = c.id
      WHERE o.id = ?
    `).get(req.params.id)
    res.json({ success: true, data: row })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.post('/:id/notify', (req: Request, res: Response): void => {
  try {
    const record = db.prepare('SELECT * FROM overstay_records WHERE id = ?').get(req.params.id) as any
    if (!record) {
      res.status(404).json({ success: false, error: 'Overstay record not found' })
      return
    }
    const { operator_name, role } = req.body

    const transaction = db.transaction(() => {
      db.prepare("UPDATE overstay_records SET status = 'notified', notified_at = datetime('now'), updated_at = datetime('now') WHERE id = ?").run(req.params.id)

      db.prepare(`
        INSERT INTO timeline_events (id, container_id, event_type, operator_name, role, description, metadata)
        VALUES (?, ?, 'overstay_notified', ?, 'customer_service', ?, ?)
      `).run(
        uuidv4(),
        record.container_id,
        operator_name || 'system',
        `超期通知已发送：集装箱 ${record.container_no} 超期 ${record.overstay_days} 天`,
        JSON.stringify({ overstay_id: req.params.id, days: record.overstay_days })
      )
    })

    transaction()
    const row = db.prepare(`
      SELECT o.*, c.customer_name
      FROM overstay_records o
      LEFT JOIN containers c ON o.container_id = c.id
      WHERE o.id = ?
    `).get(req.params.id)
    res.json({ success: true, data: row })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.post('/:id/generate-fee', (req: Request, res: Response): void => {
  try {
    const record = db.prepare('SELECT * FROM overstay_records WHERE id = ?').get(req.params.id) as any
    if (!record) {
      res.status(404).json({ success: false, error: 'Overstay record not found' })
      return
    }

    const existing = db.prepare('SELECT id FROM fee_records WHERE container_id = ?').get(record.container_id) as any
    if (existing) {
      res.status(400).json({ success: false, error: '该箱号已有费用记录' })
      return
    }

    const container = db.prepare('SELECT * FROM containers WHERE id = ?').get(record.container_id) as any
    if (!container) {
      res.status(404).json({ success: false, error: 'Container not found' })
      return
    }

    const { base_fee, overstay_fee, operator_name, role } = req.body
    const baseFee = base_fee || 500
    const overstayFee = overstay_fee || (record.overstay_days * 100)
    const totalFee = baseFee + overstayFee

    const transaction = db.transaction(() => {
      const feeId = uuidv4()
      db.prepare(`
        INSERT INTO fee_records (id, container_id, container_no, customer_name, base_fee, overstay_fee, total_fee, review_status)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
      `).run(feeId, record.container_id, record.container_no, container.customer_name, baseFee, overstayFee, totalFee)

      db.prepare(`
        INSERT INTO timeline_events (id, container_id, event_type, operator_name, role, description, metadata)
        VALUES (?, ?, 'fee_generated', ?, ?, ?, ?)
      `).run(
        uuidv4(),
        record.container_id,
        operator_name || 'system',
        role || 'system',
        `超期费用已生成：基础费 ¥${baseFee} + 超期费 ¥${overstayFee} = ¥${totalFee}`,
        JSON.stringify({ fee_id: feeId, base_fee: baseFee, overstay_fee: overstayFee, total_fee: totalFee })
      )
    })

    transaction()
    res.status(201).json({ success: true, data: { base_fee: baseFee, overstay_fee: overstayFee, total_fee: totalFee } })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

export default router
