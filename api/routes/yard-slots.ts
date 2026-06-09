import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import db from '../db.js'

const router = Router()

router.get('/', (_req: Request, res: Response): void => {
  try {
    const rows = db.prepare(`
      SELECT ys.*, c.container_no
      FROM yard_slots ys
      LEFT JOIN containers c ON ys.container_id = c.id
      ORDER BY ys.zone, ys.row_num, ys.col_num
    `).all()
    res.json({ success: true, data: rows })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.patch('/:id', (req: Request, res: Response): void => {
  try {
    const slot = db.prepare('SELECT * FROM yard_slots WHERE id = ?').get(req.params.id) as any
    if (!slot) {
      res.status(404).json({ success: false, error: 'Yard slot not found' })
      return
    }
    const { container_id, status } = req.body
    const transaction = db.transaction(() => {
      if (slot.container_id && slot.container_id !== container_id) {
        db.prepare('UPDATE containers SET yard_position = NULL WHERE id = ?').run(slot.container_id)
      }
      let newStatus = status
      if (container_id && !status) {
        const container = db.prepare('SELECT * FROM containers WHERE id = ?').get(container_id) as any
        if (container) {
          if (container.status === 'overstay') newStatus = 'overstay'
          else if (container.status === 'inspecting') newStatus = 'inspecting'
          else if (container.status === 'misplaced') newStatus = 'misplaced'
          else newStatus = 'occupied'
        }
      }
      if (!container_id) newStatus = 'empty'

      db.prepare('UPDATE yard_slots SET container_id = ?, status = ? WHERE id = ?').run(container_id || null, newStatus || slot.status, req.params.id)

      if (container_id) {
        db.prepare("UPDATE containers SET yard_position = ?, updated_at = datetime('now') WHERE id = ?").run(slot.position, container_id)
      }
    })
    transaction()
    const row = db.prepare('SELECT * FROM yard_slots WHERE id = ?').get(req.params.id)
    res.json({ success: true, data: row })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.post('/relocate', (req: Request, res: Response): void => {
  try {
    const { container_id, target_slot_id, operator_name, role } = req.body
    const container = db.prepare('SELECT * FROM containers WHERE id = ?').get(container_id) as any
    if (!container) {
      res.status(404).json({ success: false, error: 'Container not found' })
      return
    }
    const targetSlot = db.prepare('SELECT * FROM yard_slots WHERE id = ?').get(target_slot_id) as any
    if (!targetSlot) {
      res.status(404).json({ success: false, error: 'Target slot not found' })
      return
    }
    if (targetSlot.status !== 'empty') {
      res.status(400).json({ success: false, error: 'Target slot is not empty' })
      return
    }

    const currentSlot = db.prepare('SELECT * FROM yard_slots WHERE container_id = ?').get(container_id) as any

    const transaction = db.transaction(() => {
      if (currentSlot) {
        db.prepare("UPDATE yard_slots SET container_id = NULL, status = 'empty' WHERE id = ?").run(currentSlot.id)
      }

      let slotStatus = 'occupied'
      if (container.status === 'overstay') slotStatus = 'overstay'
      else if (container.status === 'inspecting') slotStatus = 'inspecting'
      else if (container.status === 'misplaced') slotStatus = 'misplaced'

      db.prepare('UPDATE yard_slots SET container_id = ?, status = ? WHERE id = ?').run(container_id, slotStatus, target_slot_id)
      db.prepare("UPDATE containers SET yard_position = ?, updated_at = datetime('now') WHERE id = ?").run(targetSlot.position, container_id)

      db.prepare(`
        INSERT INTO timeline_events (id, container_id, event_type, operator_name, role, description, metadata)
        VALUES (?, ?, 'relocate', ?, ?, ?, ?)
      `).run(
        uuidv4(),
        container_id,
        operator_name || 'system',
        role || 'dispatcher',
        `集装箱 ${container.container_no} 从 ${currentSlot ? currentSlot.position : '未知'} 移至 ${targetSlot.position}`,
        JSON.stringify({ from: currentSlot?.position || null, to: targetSlot.position })
      )
    })

    transaction()
    const updatedSlot = db.prepare('SELECT * FROM yard_slots WHERE id = ?').get(target_slot_id)
    res.json({ success: true, data: updatedSlot })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

export default router
