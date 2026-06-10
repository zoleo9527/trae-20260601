import { Router, type Request, type Response } from 'express'
import pool from '../db.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

router.use(authMiddleware)

router.get('/parking-logs', async (req: Request, res: Response): Promise<void> => {
  const { plateNumber, startTime, endTime } = req.query

  try {
    const conditions: string[] = []
    const params: unknown[] = []

    if (plateNumber) {
      params.push(plateNumber)
      conditions.push(`plate_number = $${params.length}`)
    }
    if (startTime) {
      params.push(startTime)
      conditions.push(`timestamp >= $${params.length}`)
    }
    if (endTime) {
      params.push(endTime)
      conditions.push(`timestamp <= $${params.length}`)
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''

    const result = await pool.query(
      `SELECT * FROM parking_logs ${whereClause} ORDER BY timestamp DESC LIMIT 200`,
      params
    )

    res.json({ success: true, data: result.rows })
  } catch (err) {
    console.error('Query parking logs error:', err)
    res.status(500).json({ success: false, error: '服务器内部错误' })
  }
})

router.get('/monthly-rentals', async (req: Request, res: Response): Promise<void> => {
  const { plateNumber, status } = req.query

  try {
    const conditions: string[] = []
    const params: unknown[] = []

    if (plateNumber) {
      params.push(plateNumber)
      conditions.push(`plate_number = $${params.length}`)
    }
    if (status) {
      params.push(status)
      conditions.push(`status = $${params.length}`)
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''

    const result = await pool.query(
      `SELECT * FROM monthly_rentals ${whereClause} ORDER BY end_date DESC LIMIT 100`,
      params
    )

    res.json({ success: true, data: result.rows })
  } catch (err) {
    console.error('Query monthly rentals error:', err)
    res.status(500).json({ success: false, error: '服务器内部错误' })
  }
})

router.get('/gate-anomalies', async (req: Request, res: Response): Promise<void> => {
  const { gateId, startTime, endTime } = req.query

  try {
    const conditions: string[] = []
    const params: unknown[] = []

    if (gateId) {
      params.push(Number(gateId))
      conditions.push(`gate_id = $${params.length}`)
    }
    if (startTime) {
      params.push(startTime)
      conditions.push(`detected_at >= $${params.length}`)
    }
    if (endTime) {
      params.push(endTime)
      conditions.push(`detected_at <= $${params.length}`)
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''

    const result = await pool.query(
      `SELECT * FROM gate_anomalies ${whereClause} ORDER BY detected_at DESC LIMIT 100`,
      params
    )

    res.json({ success: true, data: result.rows })
  } catch (err) {
    console.error('Query gate anomalies error:', err)
    res.status(500).json({ success: false, error: '服务器内部错误' })
  }
})

router.get('/complaint/:complaintId', async (req: Request, res: Response): Promise<void> => {
  const { complaintId } = req.params

  try {
    const linksResult = await pool.query(
      'SELECT * FROM evidence_links WHERE complaint_id = $1',
      [complaintId]
    )

    const parkingLogIds: number[] = []
    const rentalIds: number[] = []
    const anomalyIds: number[] = []

    for (const link of linksResult.rows) {
      if (link.evidence_type === 'parking_log') parkingLogIds.push(link.evidence_id)
      else if (link.evidence_type === 'monthly_rental') rentalIds.push(link.evidence_id)
      else if (link.evidence_type === 'gate_anomaly') anomalyIds.push(link.evidence_id)
    }

    let parkingLogs: unknown[] = []
    let monthlyRentals: unknown[] = []
    let gateAnomalies: unknown[] = []

    if (parkingLogIds.length > 0) {
      const r = await pool.query(`SELECT * FROM parking_logs WHERE id = ANY($1)`, [parkingLogIds])
      parkingLogs = r.rows
    }

    if (rentalIds.length > 0) {
      const r = await pool.query(`SELECT * FROM monthly_rentals WHERE id = ANY($1)`, [rentalIds])
      monthlyRentals = r.rows
    }

    if (anomalyIds.length > 0) {
      const r = await pool.query(`SELECT * FROM gate_anomalies WHERE id = ANY($1)`, [anomalyIds])
      gateAnomalies = r.rows
    }

    res.json({
      success: true,
      data: {
        links: linksResult.rows,
        parking_logs: parkingLogs,
        monthly_rentals: monthlyRentals,
        gate_anomalies: gateAnomalies,
      },
    })
  } catch (err) {
    console.error('Get complaint evidence error:', err)
    res.status(500).json({ success: false, error: '服务器内部错误' })
  }
})

router.get('/reviews', async (req: Request, res: Response): Promise<void> => {
  const { status, complaintId } = req.query

  try {
    const conditions: string[] = []
    const params: unknown[] = []

    if (status) {
      params.push(status)
      conditions.push(`er.status = $${params.length}`)
    }
    if (complaintId) {
      params.push(Number(complaintId))
      conditions.push(`er.complaint_id = $${params.length}`)
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''

    const result = await pool.query(
      `SELECT er.*, u.name as reviewer_name, c.complaint_no, c.type as complaint_type, c.status as complaint_status, c.description as complaint_description
      FROM evidence_reviews er
      LEFT JOIN users u ON er.reviewer_id = u.id
      LEFT JOIN complaints c ON er.complaint_id = c.id
      ${whereClause}
      ORDER BY er.updated_at DESC`,
      params
    )

    res.json({ success: true, data: result.rows })
  } catch (err) {
    console.error('List evidence reviews error:', err)
    res.status(500).json({ success: false, error: '服务器内部错误' })
  }
})

router.post('/reviews', async (req: Request, res: Response): Promise<void> => {
  const { complaintId, reviewerId, status, blockedReason } = req.body
  const operator = req.user!

  if (!complaintId || !reviewerId) {
    res.status(400).json({ success: false, error: '缺少必要字段' })
    return
  }

  try {
    const existing = await pool.query(
      'SELECT * FROM evidence_reviews WHERE complaint_id = $1',
      [complaintId]
    )

    if (existing.rows.length > 0) {
      res.status(409).json({ success: false, error: '该投诉已有证据回查记录' })
      return
    }

    const result = await pool.query(
      `INSERT INTO evidence_reviews (complaint_id, reviewer_id, status, blocked_reason)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [complaintId, reviewerId, status || 'pending', blockedReason || null]
    )

    await pool.query(
      `INSERT INTO complaint_timeline (complaint_id, action, operator_id, operator_name, operator_role, detail)
       VALUES ($1, 'evidence_review_started', $2, $3, $4, '证据回查已创建')`,
      [complaintId, operator.id, operator.name, operator.role]
    )

    const reviewWithUser = await pool.query(
      `SELECT er.*, u.name as reviewer_name FROM evidence_reviews er LEFT JOIN users u ON er.reviewer_id = u.id WHERE er.id = $1`,
      [result.rows[0].id]
    )

    res.status(201).json({ success: true, data: reviewWithUser.rows[0] })
  } catch (err) {
    console.error('Create evidence review error:', err)
    res.status(500).json({ success: false, error: '服务器内部错误' })
  }
})

router.patch('/reviews/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params
  const { status, blockedReason } = req.body
  const operator = req.user!

  try {
    const existing = await pool.query('SELECT * FROM evidence_reviews WHERE id = $1', [id])
    if (existing.rows.length === 0) {
      res.status(404).json({ success: false, error: '回查记录不存在' })
      return
    }

    const review = existing.rows[0]
    const updates: string[] = ['updated_at = NOW()']
    const params: unknown[] = []
    let paramIdx = 1

    if (status !== undefined) {
      params.push(status)
      updates.push(`status = $${paramIdx++}`)
    }

    if (blockedReason !== undefined) {
      params.push(blockedReason)
      updates.push(`blocked_reason = $${paramIdx++}`)
    }

    if (status === 'completed') {
      updates.push('completed_at = NOW()')
    }

    params.push(id)

    await pool.query(
      `UPDATE evidence_reviews SET ${updates.join(', ')} WHERE id = $${paramIdx}`,
      params
    )

    const statusLabels: Record<string, string> = {
      pending: '待回查',
      in_progress: '回查中',
      completed: '已完成',
      blocked: '受阻',
    }

    let detail = `证据回查状态更新为: ${statusLabels[status] || status}`
    if (status === 'blocked' && blockedReason) {
      detail += `，受阻原因: ${blockedReason}`
    }

    await pool.query(
      `INSERT INTO complaint_timeline (complaint_id, action, operator_id, operator_name, operator_role, detail)
       VALUES ($1, 'evidence_review_updated', $2, $3, $4, $5)`,
      [review.complaint_id, operator.id, operator.name, operator.role, detail]
    )

    const updated = await pool.query(
      `SELECT er.*, u.name as reviewer_name FROM evidence_reviews er LEFT JOIN users u ON er.reviewer_id = u.id WHERE er.id = $1`,
      [id]
    )

    res.json({ success: true, data: updated.rows[0] })
  } catch (err) {
    console.error('Update evidence review error:', err)
    res.status(500).json({ success: false, error: '服务器内部错误' })
  }
})

export default router
