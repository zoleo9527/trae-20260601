import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import db from '../db.js'

const router = Router()

router.get('/', (_req: Request, res: Response): void => {
  try {
    const rows = db.prepare('SELECT * FROM inspection_plans ORDER BY planned_time DESC').all()
    res.json({ success: true, data: rows })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.get('/missed-notifications', (_req: Request, res: Response): void => {
  try {
    const rows = db.prepare("SELECT * FROM inspection_plans WHERE planned_time < datetime('now') AND notified_status = 'not_notified'").all()
    res.json({ success: true, data: rows })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.post('/', (req: Request, res: Response): void => {
  try {
    const { container_id, container_no, planned_time, created_by } = req.body
    const id = uuidv4()
    const now = new Date().toISOString()

    const transaction = db.transaction(() => {
      db.prepare(`
        INSERT INTO inspection_plans (id, container_id, container_no, planned_time, notified_status, status, created_by, created_at, updated_at)
        VALUES (?, ?, ?, ?, 'not_notified', 'planned', ?, ?, ?)
      `).run(id, container_id, container_no, planned_time, created_by, now, now)

      db.prepare(`
        INSERT INTO timeline_events (id, container_id, event_type, operator_name, role, description, metadata)
        VALUES (?, ?, 'inspection_planned', ?, 'dispatcher', ?, ?)
      `).run(uuidv4(), container_id, created_by, `集装箱 ${container_no} 安排查验`, JSON.stringify({ plan_id: id, planned_time }))
    })

    transaction()
    const row = db.prepare('SELECT * FROM inspection_plans WHERE id = ?').get(id)
    res.status(201).json({ success: true, data: row })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.patch('/:id', (req: Request, res: Response): void => {
  try {
    const plan = db.prepare('SELECT * FROM inspection_plans WHERE id = ?').get(req.params.id) as any
    if (!plan) {
      res.status(404).json({ success: false, error: 'Inspection plan not found' })
      return
    }
    const { planned_time, status } = req.body
    const fields: string[] = []
    const values: any[] = []
    if (planned_time !== undefined) {
      fields.push('planned_time = ?')
      values.push(planned_time)
    }
    if (status !== undefined) {
      fields.push('status = ?')
      values.push(status)
    }
    if (fields.length === 0) {
      res.status(400).json({ success: false, error: 'No valid fields to update' })
      return
    }
    fields.push("updated_at = datetime('now')")
    values.push(req.params.id)

    const transaction = db.transaction(() => {
      db.prepare(`UPDATE inspection_plans SET ${fields.join(', ')} WHERE id = ?`).run(...values)

      if (status) {
        const statusLabels: Record<string, string> = {
          planned: '已计划', in_progress: '查验中', completed: '已完成',
        }
        db.prepare(`
          INSERT INTO timeline_events (id, container_id, event_type, operator_name, role, description, metadata)
          VALUES (?, ?, 'inspection_status_change', 'system', 'dispatcher', ?, ?)
        `).run(
          uuidv4(),
          plan.container_id,
          `查验状态变更：${statusLabels[plan.status] || plan.status} → ${statusLabels[status] || status}`,
          JSON.stringify({ plan_id: req.params.id, from: plan.status, to: status })
        )
      }
    })

    transaction()
    const row = db.prepare('SELECT * FROM inspection_plans WHERE id = ?').get(req.params.id)
    res.json({ success: true, data: row })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.post('/:id/notify', (req: Request, res: Response): void => {
  try {
    const plan = db.prepare('SELECT * FROM inspection_plans WHERE id = ?').get(req.params.id) as any
    if (!plan) {
      res.status(404).json({ success: false, error: 'Inspection plan not found' })
      return
    }

    const transaction = db.transaction(() => {
      db.prepare("UPDATE inspection_plans SET notified_status = 'notified', notified_at = datetime('now'), updated_at = datetime('now') WHERE id = ?").run(req.params.id)

      db.prepare(`
        INSERT INTO timeline_events (id, container_id, event_type, operator_name, role, description, metadata)
        VALUES (?, ?, 'inspection_notified', 'system', 'dispatcher', ?, ?)
      `).run(
        uuidv4(),
        plan.container_id,
        `查验通知已发送：集装箱 ${plan.container_no} 计划查验时间 ${plan.planned_time}`,
        JSON.stringify({ plan_id: req.params.id, planned_time: plan.planned_time })
      )
    })

    transaction()
    const row = db.prepare('SELECT * FROM inspection_plans WHERE id = ?').get(req.params.id)
    res.json({ success: true, data: row })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

export default router
