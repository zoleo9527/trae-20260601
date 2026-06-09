import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import db from '../db.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  try {
    const { reviewStatus, containerId } = req.query
    let rows: any[]
    let sql = 'SELECT * FROM fee_records WHERE 1=1'
    const params: any[] = []
    if (reviewStatus) {
      sql += ' AND review_status = ?'
      params.push(reviewStatus)
    }
    if (containerId) {
      sql += ' AND container_id = ?'
      params.push(containerId)
    }
    sql += ' ORDER BY created_at DESC'
    rows = db.prepare(sql).all(...params)
    res.json({ success: true, data: rows })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.get('/:id', (req: Request, res: Response): void => {
  try {
    const fee = db.prepare('SELECT * FROM fee_records WHERE id = ?').get(req.params.id) as any
    if (!fee) {
      res.status(404).json({ success: false, error: 'Fee record not found' })
      return
    }
    const entries = db.prepare('SELECT * FROM review_entries WHERE fee_record_id = ? ORDER BY created_at').all(req.params.id)
    res.json({ success: true, data: { ...fee, review_entries: entries } })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.patch('/:id/review', (req: Request, res: Response): void => {
  try {
    const fee = db.prepare('SELECT * FROM fee_records WHERE id = ?').get(req.params.id) as any
    if (!fee) {
      res.status(404).json({ success: false, error: 'Fee record not found' })
      return
    }
    const { action, operator_name, role, comment, adjusted_amount } = req.body

    let reviewStatus = fee.review_status
    if (action === 'submit_review') reviewStatus = 'reviewing'
    else if (action === 'approve') reviewStatus = 'approved'
    else if (action === 'reject') reviewStatus = 'rejected'
    else if (action === 'dispute') reviewStatus = 'disputed'

    const actionLabels: Record<string, string> = {
      submit_review: '提交复核', approve: '审核通过', reject: '审核驳回', dispute: '发起争议', adjust: '调整金额',
    }

    const transaction = db.transaction(() => {
      db.prepare(`
        INSERT INTO review_entries (id, fee_record_id, action, operator_name, role, comment, adjusted_amount)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(uuidv4(), req.params.id, action, operator_name, role, comment || null, adjusted_amount || null)

      let totalFee = fee.total_fee
      if (action === 'adjust' && adjusted_amount !== undefined) {
        totalFee = adjusted_amount
      }

      db.prepare("UPDATE fee_records SET review_status = ?, total_fee = ?, updated_at = datetime('now') WHERE id = ?").run(reviewStatus, totalFee, req.params.id)

      db.prepare(`
        INSERT INTO timeline_events (id, container_id, event_type, operator_name, role, description, metadata)
        VALUES (?, ?, 'fee_review', ?, ?, ?, ?)
      `).run(
        uuidv4(),
        fee.container_id,
        'fee_review',
        operator_name || 'system',
        role || 'system',
        `费用复核：${actionLabels[action] || action}（¥${totalFee.toLocaleString()}）${comment ? ' - ' + comment : ''}`,
        JSON.stringify({ fee_id: req.params.id, action, review_status: reviewStatus, total_fee: totalFee })
      )
    })

    transaction()
    const row = db.prepare('SELECT * FROM fee_records WHERE id = ?').get(req.params.id)
    res.json({ success: true, data: row })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.post('/:id/dispute', (req: Request, res: Response): void => {
  try {
    const fee = db.prepare('SELECT * FROM fee_records WHERE id = ?').get(req.params.id) as any
    if (!fee) {
      res.status(404).json({ success: false, error: 'Fee record not found' })
      return
    }
    const { operator_name, role, comment } = req.body

    const transaction = db.transaction(() => {
      db.prepare(`
        INSERT INTO review_entries (id, fee_record_id, action, operator_name, role, comment, adjusted_amount)
        VALUES (?, ?, 'dispute', ?, ?, ?, ?)
      `).run(uuidv4(), req.params.id, operator_name, role, comment || null, null)

      db.prepare("UPDATE fee_records SET review_status = 'disputed', updated_at = datetime('now') WHERE id = ?").run(req.params.id)

      db.prepare(`
        INSERT INTO timeline_events (id, container_id, event_type, operator_name, role, description, metadata)
        VALUES (?, ?, 'fee_dispute', ?, ?, ?, ?)
      `).run(
        uuidv4(),
        fee.container_id,
        'fee_dispute',
        operator_name || 'system',
        role || 'system',
        `费用争议：${comment || '客户对费用有异议'}（¥${fee.total_fee.toLocaleString()}）`,
        JSON.stringify({ fee_id: req.params.id, action: 'dispute', total_fee: fee.total_fee })
      )
    })

    transaction()
    const row = db.prepare('SELECT * FROM fee_records WHERE id = ?').get(req.params.id)
    res.json({ success: true, data: row })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

export default router
