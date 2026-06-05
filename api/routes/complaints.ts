import { Router, type Request, type Response } from 'express'
import db, { logOperation } from '../db.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  try {
    const { status } = req.query
    let sql = 'SELECT * FROM complaints WHERE 1=1'
    const params: unknown[] = []

    if (status) {
      sql += ' AND status = ?'
      params.push(status)
    }

    sql += ' ORDER BY created_at DESC'

    const rows = db.prepare(sql).all(...params)
    res.json({ success: true, data: rows })
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) })
  }
})

router.get('/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const complaint = db.prepare('SELECT * FROM complaints WHERE id = ?').get(id) as any
    if (!complaint) {
      res.status(404).json({ success: false, error: '客诉不存在' })
      return
    }

    let curve = null
    if (complaint.curve_id) {
      curve = db.prepare('SELECT * FROM roast_curves WHERE id = ?').get(complaint.curve_id)
    }

    let cuppingScore = null
    if (complaint.cupping_score_id) {
      cuppingScore = db.prepare('SELECT * FROM cupping_scores WHERE id = ?').get(complaint.cupping_score_id)
    }

    res.json({
      success: true,
      data: { ...complaint, curve, cuppingScore },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) })
  }
})

router.post('/', (req: Request, res: Response): void => {
  try {
    const { customer_name, channel, content, curve_id, cupping_score_id, batch_code, handler } = req.body
    if (!customer_name || !channel || !content) {
      res.status(400).json({ success: false, error: '缺少必填字段' })
      return
    }

    const tx = db.transaction(() => {
      const result = db.prepare(
        `INSERT INTO complaints (customer_name, channel, content, curve_id, cupping_score_id, batch_code, status, handler)
         VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)`
      ).run(customer_name, channel, content, curve_id ?? null, cupping_score_id ?? null, batch_code ?? null, handler ?? null)

      const complaintId = Number(result.lastInsertRowid)
      logOperation('complaint', 'create', handler ?? 'system', 'complaint', complaintId,
        `收到客诉：${customer_name}-${content.substring(0, 20)}`
      )

      return complaintId
    })

    const complaintId = tx()
    const complaint = db.prepare('SELECT * FROM complaints WHERE id = ?').get(complaintId)

    res.status(201).json({ success: true, data: complaint })
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) })
  }
})

router.put('/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const { status, handler, operator } = req.body

    const complaint = db.prepare('SELECT * FROM complaints WHERE id = ?').get(id) as any
    if (!complaint) {
      res.status(404).json({ success: false, error: '客诉不存在' })
      return
    }

    db.prepare(
      `UPDATE complaints SET status = ?, handler = ?, updated_at = datetime('now') WHERE id = ?`
    ).run(status ?? complaint.status, handler ?? complaint.handler, id)

    logOperation('complaint', 'update', operator ?? 'system', 'complaint', Number(id),
      `更新客诉状态：${status ?? complaint.status}`
    )

    const updated = db.prepare('SELECT * FROM complaints WHERE id = ?').get(id)
    res.json({ success: true, data: updated })
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) })
  }
})

export default router
