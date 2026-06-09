import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import db from '../db.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  try {
    const { containerId } = req.query
    let rows: any[]
    if (containerId) {
      rows = db.prepare('SELECT * FROM gate_records WHERE container_id = ? ORDER BY gate_time DESC').all(containerId as string)
    } else {
      rows = db.prepare('SELECT * FROM gate_records ORDER BY gate_time DESC').all()
    }
    res.json({ success: true, data: rows })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.post('/', (req: Request, res: Response): void => {
  try {
    const { container_id: rawContainerId, container_no, direction, gate_time, operator_name, anomaly, anomaly_note, type, customer_id, customer_name, free_days, yard_position } = req.body
    const id = uuidv4()
    const now = new Date().toISOString()
    let containerId = rawContainerId

    const transaction = db.transaction(() => {
      if (direction === 'in') {
        if (!containerId) {
          containerId = uuidv4()
        }
        const existing = db.prepare('SELECT id FROM containers WHERE id = ?').get(containerId) as any
        if (!existing) {
          const matchedByNo = container_no ? (db.prepare('SELECT id FROM containers WHERE container_no = ?').get(container_no) as any) : null
          if (matchedByNo) {
            containerId = matchedByNo.id
          } else {
            db.prepare(`
              INSERT INTO containers (id, container_no, type, status, customer_id, customer_name, gate_in_time, yard_position, free_days, overstay_days, created_at, updated_at)
              VALUES (?, ?, ?, 'normal', ?, ?, ?, ?, ?, 0, ?, ?)
            `).run(containerId, container_no || `AUTO-${Date.now()}`, type || '20GP', customer_id || 'C999', customer_name || '待确认客户', gate_time || now, yard_position || null, free_days || 7, now, now)
          }
        }
      }

      if (direction === 'out') {
        if (!containerId && container_no) {
          const byNo = db.prepare('SELECT id FROM containers WHERE container_no = ?').get(container_no) as any
          if (byNo) containerId = byNo.id
        }
        if (containerId) {
          db.prepare("UPDATE containers SET status = 'departed', gate_out_time = ?, updated_at = datetime('now') WHERE id = ?").run(gate_time || now, containerId)
        }
      }

      db.prepare(`
        INSERT INTO gate_records (id, container_id, container_no, direction, gate_time, operator_name, anomaly, anomaly_note)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, containerId, container_no || '', direction, gate_time || now, operator_name || '系统', anomaly || 'none', anomaly_note || null)

      db.prepare(`
        INSERT INTO timeline_events (id, container_id, event_type, operator_name, role, description, metadata)
        VALUES (?, ?, ?, ?, 'gate_operator', ?, ?)
      `).run(
        uuidv4(),
        containerId,
        direction === 'in' ? 'gate_in' : 'gate_out',
        operator_name || '系统',
        direction === 'in' ? `集装箱 ${container_no || containerId} 进场` : `集装箱 ${container_no || containerId} 出场`,
        JSON.stringify({ direction, gate_time: gate_time || now })
      )

      if (anomaly && anomaly !== 'none') {
        db.prepare(`
          INSERT INTO timeline_events (id, container_id, event_type, operator_name, role, description, metadata)
          VALUES (?, ?, 'anomaly_marked', ?, 'gate_operator', ?, ?)
        `).run(
          uuidv4(),
          containerId,
          operator_name || '系统',
          `闸口异常标记：${anomaly}${anomaly_note ? ' - ' + anomaly_note : ''}`,
          JSON.stringify({ anomaly, anomaly_note })
        )
      }
    })

    transaction()
    const row = db.prepare('SELECT * FROM gate_records WHERE id = ?').get(id)
    res.status(201).json({ success: true, data: row })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.patch('/:id', (req: Request, res: Response): void => {
  try {
    const record = db.prepare('SELECT * FROM gate_records WHERE id = ?').get(req.params.id) as any
    if (!record) {
      res.status(404).json({ success: false, error: 'Gate record not found' })
      return
    }
    const { anomaly, anomaly_note } = req.body
    db.prepare('UPDATE gate_records SET anomaly = ?, anomaly_note = ? WHERE id = ?').run(anomaly || record.anomaly, anomaly_note !== undefined ? anomaly_note : record.anomaly_note, req.params.id)
    const row = db.prepare('SELECT * FROM gate_records WHERE id = ?').get(req.params.id)
    res.json({ success: true, data: row })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

export default router
