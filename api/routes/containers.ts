import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import db from '../db.js'

const router = Router()

router.get('/misplaced', (_req: Request, res: Response): void => {
  try {
    const rows = db.prepare(`
      SELECT c.*, ys.position as current_slot_position, ys.id as slot_id
      FROM containers c
      LEFT JOIN yard_slots ys ON ys.container_id = c.id
      WHERE c.status = 'misplaced'
      ORDER BY c.updated_at DESC
    `).all()
    res.json({ success: true, data: rows })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.get('/stats', (_req: Request, res: Response): void => {
  try {
    const totalContainers = (db.prepare("SELECT COUNT(*) as cnt FROM containers WHERE status != 'departed'").get() as any).cnt
    const overstayCount = (db.prepare("SELECT COUNT(*) as cnt FROM containers WHERE status = 'overstay'").get() as any).cnt
    const misplacedCount = (db.prepare("SELECT COUNT(*) as cnt FROM containers WHERE status = 'misplaced'").get() as any).cnt
    const inspectingCount = (db.prepare("SELECT COUNT(*) as cnt FROM containers WHERE status = 'inspecting'").get() as any).cnt
    const disputedCount = (db.prepare("SELECT COUNT(*) as cnt FROM fee_records WHERE review_status = 'disputed'").get() as any).cnt
    const pendingNotifyCount = (db.prepare("SELECT COUNT(*) as cnt FROM overstay_records WHERE status = 'pending_notify'").get() as any).cnt
    const pendingFeeReviewCount = (db.prepare("SELECT COUNT(*) as cnt FROM fee_records WHERE review_status = 'pending'").get() as any).cnt
    const missedNotificationCount = (db.prepare("SELECT COUNT(*) as cnt FROM inspection_plans WHERE notified_status = 'not_notified'").get() as any).cnt

    res.json({
      success: true,
      data: {
        totalContainers,
        overstayCount,
        disputedCount,
        inspectingCount,
        misplacedCount,
        pendingNotifyCount,
        pendingFeeReviewCount,
        missedNotificationCount,
      },
    })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.get('/', (req: Request, res: Response): void => {
  try {
    const { status } = req.query
    let rows: any[]
    if (status) {
      rows = db.prepare('SELECT * FROM containers WHERE status = ? ORDER BY created_at DESC').all(status as string)
    } else {
      rows = db.prepare('SELECT * FROM containers ORDER BY created_at DESC').all()
    }
    res.json({ success: true, data: rows })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.get('/:id', (req: Request, res: Response): void => {
  try {
    const row = db.prepare('SELECT * FROM containers WHERE id = ?').get(req.params.id)
    if (!row) {
      res.status(404).json({ success: false, error: 'Container not found' })
      return
    }
    res.json({ success: true, data: row })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.post('/', (req: Request, res: Response): void => {
  try {
    const id = uuidv4()
    const { container_no, type, customer_id, customer_name, gate_in_time, yard_position, free_days } = req.body
    const now = new Date().toISOString()
    db.prepare(`
      INSERT INTO containers (id, container_no, type, status, customer_id, customer_name, gate_in_time, yard_position, free_days, overstay_days, created_at, updated_at)
      VALUES (?, ?, ?, 'normal', ?, ?, ?, ?, ?, 0, ?, ?)
    `).run(id, container_no, type, customer_id, customer_name, gate_in_time || now, yard_position || null, free_days || 7, now, now)
    const row = db.prepare('SELECT * FROM containers WHERE id = ?').get(id)
    res.status(201).json({ success: true, data: row })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.patch('/:id', (req: Request, res: Response): void => {
  try {
    const container = db.prepare('SELECT * FROM containers WHERE id = ?').get(req.params.id) as any
    if (!container) {
      res.status(404).json({ success: false, error: 'Container not found' })
      return
    }
    const fields: string[] = []
    const values: any[] = []
    const allowed = ['container_no', 'type', 'customer_id', 'customer_name', 'gate_in_time', 'gate_out_time', 'yard_position', 'free_days', 'overstay_days']
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        fields.push(`${key} = ?`)
        values.push(req.body[key])
      }
    }
    if (fields.length === 0) {
      res.status(400).json({ success: false, error: 'No valid fields to update' })
      return
    }
    fields.push("updated_at = datetime('now')")
    values.push(req.params.id)
    db.prepare(`UPDATE containers SET ${fields.join(', ')} WHERE id = ?`).run(...values)
    const row = db.prepare('SELECT * FROM containers WHERE id = ?').get(req.params.id)
    res.json({ success: true, data: row })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.patch('/:id/status', (req: Request, res: Response): void => {
  try {
    const { status, operator_name, role, description } = req.body
    const container = db.prepare('SELECT * FROM containers WHERE id = ?').get(req.params.id) as any
    if (!container) {
      res.status(404).json({ success: false, error: 'Container not found' })
      return
    }
    db.prepare("UPDATE containers SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, req.params.id)

    db.prepare(`
      INSERT INTO timeline_events (id, container_id, event_type, operator_name, role, description, metadata)
      VALUES (?, ?, 'status_change', ?, ?, ?, ?)
    `).run(uuidv4(), req.params.id, operator_name || 'system', role || 'system', description || `状态变更为 ${status}`, JSON.stringify({ from: container.status, to: status }))

    const row = db.prepare('SELECT * FROM containers WHERE id = ?').get(req.params.id)
    res.json({ success: true, data: row })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.post('/:id/relocate-misplaced', (req: Request, res: Response): void => {
  try {
    const { target_slot_id, actual_position, operator_name, role, note, photo_base64 } = req.body
    const container = db.prepare('SELECT * FROM containers WHERE id = ?').get(req.params.id) as any
    if (!container) {
      res.status(404).json({ success: false, error: 'Container not found' })
      return
    }
    if (container.status !== 'misplaced') {
      res.status(400).json({ success: false, error: 'Container is not misplaced' })
      return
    }

    const targetSlot = target_slot_id
      ? db.prepare('SELECT * FROM yard_slots WHERE id = ?').get(target_slot_id) as any
      : actual_position
        ? db.prepare('SELECT * FROM yard_slots WHERE position = ?').get(actual_position) as any
        : null

    if (!targetSlot) {
      res.status(400).json({ success: false, error: 'Target slot not found' })
      return
    }
    if (targetSlot.status !== 'empty') {
      res.status(400).json({ success: false, error: 'Target slot is not empty' })
      return
    }

    const currentSlot = db.prepare('SELECT * FROM yard_slots WHERE container_id = ?').get(req.params.id) as any

    const transaction = db.transaction(() => {
      if (currentSlot) {
        db.prepare("UPDATE yard_slots SET container_id = NULL, status = 'empty' WHERE id = ?").run(currentSlot.id)
      }

      db.prepare('UPDATE yard_slots SET container_id = ?, status = ? WHERE id = ?').run(req.params.id, 'occupied', targetSlot.id)
      db.prepare("UPDATE containers SET status = 'normal', yard_position = ?, updated_at = datetime('now') WHERE id = ?").run(targetSlot.position, req.params.id)

      const metadata: any = {
        from: currentSlot?.position || null,
        to: targetSlot.position,
        note: note || null,
      }

      db.prepare(`
        INSERT INTO timeline_events (id, container_id, event_type, operator_name, role, description, metadata)
        VALUES (?, ?, 'misplace_relocate', ?, ?, ?, ?)
      `).run(
        uuidv4(),
        req.params.id,
        operator_name || 'system',
        role || 'dispatcher',
        `错放箱 ${container.container_no} 复位：${currentSlot?.position || '未知'} → ${targetSlot.position}${note ? '，备注：' + note : ''}`,
        JSON.stringify(metadata),
      )

      if (photo_base64) {
        db.prepare(`
          INSERT INTO attachments (id, container_id, file_name, file_size, mime_type, base64_data, uploaded_by)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(uuidv4(), req.params.id, `复位照片-${container.container_no}.jpg`, photo_base64.length, 'image/jpeg', photo_base64, operator_name || 'system')
      }
    })

    transaction()
    const updated = db.prepare('SELECT * FROM containers WHERE id = ?').get(req.params.id)
    res.json({ success: true, data: updated })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.post('/batch-status', (req: Request, res: Response): void => {
  try {
    const { ids, status, operator_name, role, description } = req.body
    if (!Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ success: false, error: 'ids must be a non-empty array' })
      return
    }
    const updateStmt = db.prepare("UPDATE containers SET status = ?, updated_at = datetime('now') WHERE id = ?")
    const insertTimeline = db.prepare(`
      INSERT INTO timeline_events (id, container_id, event_type, operator_name, role, description, metadata)
      VALUES (?, ?, 'status_change', ?, ?, ?, ?)
    `)

    const transaction = db.transaction(() => {
      for (const id of ids) {
        const container = db.prepare('SELECT * FROM containers WHERE id = ?').get(id) as any
        if (!container) continue
        updateStmt.run(status, id)
        insertTimeline.run(uuidv4(), id, operator_name || 'system', role || 'system', description || `批量状态变更为 ${status}`, JSON.stringify({ from: container.status, to: status }))
      }
    })
    transaction()

    res.json({ success: true, data: { updated: ids.length } })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

export default router
