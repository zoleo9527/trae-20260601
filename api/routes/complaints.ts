import { Router, type Request, type Response } from 'express'
import pool from '../db.js'
import { authMiddleware } from '../middleware/auth.js'
import type { AuthPayload } from '../middleware/auth.js'

const router = Router()

router.use(authMiddleware)

async function addTimeline(
  complaintId: number,
  action: string,
  operator: AuthPayload,
  detail?: string
) {
  await pool.query(
    'INSERT INTO complaint_timeline (complaint_id, action, operator_id, operator_name, operator_role, detail) VALUES ($1, $2, $3, $4, $5, $6)',
    [complaintId, action, operator.id, operator.name, operator.role, detail || null]
  )
}

function generateComplaintNo(): string {
  const now = new Date()
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '')
  const rand = String(Math.floor(Math.random() * 10000)).padStart(4, '0')
  return `CP${dateStr}${rand}`
}

function computeStuckPoint(complaint: any, evidenceReview: any): string | null {
  if (complaint.status === 'closed') return null

  if (complaint.status === 'pending' && !complaint.assignee_id) {
    return 'unassigned'
  }

  if (!evidenceReview || evidenceReview.status === 'pending') {
    return 'no_evidence'
  }

  if (evidenceReview && evidenceReview.status === 'blocked') {
    return 'evidence_blocked'
  }

  if (complaint.status === 'appealing') {
    return 'appeal_pending'
  }

  if (complaint.is_overdue && complaint.status !== 'closed') {
    return 'overdue_processing'
  }

  const updatedAt = new Date(complaint.updated_at)
  const hoursSinceUpdate = (Date.now() - updatedAt.getTime()) / (1000 * 60 * 60)
  if (hoursSinceUpdate > 24 && complaint.status !== 'closed') {
    return 'no_progress'
  }

  return null
}

router.get('/', async (req: Request, res: Response): Promise<void> => {
  const { status, type, assignee, overdue, page, limit, group } = req.query

  try {
    const conditions: string[] = []
    const params: unknown[] = []

    if (group === 'today') {
      conditions.push("c.created_at >= CURRENT_DATE")
    } else if (group === 'overdue') {
      conditions.push("c.deadline < NOW() AND c.status != 'closed'")
    } else if (group === 'rejected') {
      conditions.push("c.status = 'rejected'")
    } else if (group === 'dashboard') {
      conditions.push(
        "(c.created_at >= CURRENT_DATE OR (c.deadline < NOW() AND c.status != 'closed') OR c.status = 'rejected')"
      )
    } else {
      if (status) {
        params.push(status)
        conditions.push(`c.status = $${params.length}`)
      }
      if (type) {
        params.push(type)
        conditions.push(`c.type = $${params.length}`)
      }
      if (assignee) {
        params.push(Number(assignee))
        conditions.push(`c.assignee_id = $${params.length}`)
      }
      if (overdue === 'true') {
        conditions.push("c.deadline < NOW() AND c.status != 'closed'")
      }
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''

    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM complaints c ${whereClause}`,
      params
    )
    const total = parseInt(countResult.rows[0].total, 10)

    const pageNum = Math.max(1, Number(page) || 1)
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 20))
    const offset = (pageNum - 1) * limitNum

    const result = await pool.query(
      `SELECT c.*, u.name as assignee_name,
        CASE WHEN c.deadline < NOW() AND c.status != 'closed' THEN true ELSE false END as is_overdue
      FROM complaints c
      LEFT JOIN users u ON c.assignee_id = u.id
      ${whereClause}
      ORDER BY c.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limitNum, offset]
    )

    const complaintIds = result.rows.map((r: any) => r.id)
    let evidenceReviews: any[] = []
    if (complaintIds.length > 0) {
      const erResult = await pool.query(
        'SELECT er.*, u.name as reviewer_name FROM evidence_reviews er LEFT JOIN users u ON er.reviewer_id = u.id WHERE er.complaint_id = ANY($1)',
        [complaintIds]
      )
      evidenceReviews = erResult.rows
    }

    const itemsWithStuck = result.rows.map((c: any) => {
      const er = evidenceReviews.find((r: any) => r.complaint_id === c.id) || null
      return {
        ...c,
        stuck_point: computeStuckPoint(c, er),
        evidence_review_status: er ? er.status : null,
      }
    })

    res.json({
      success: true,
      data: {
        items: itemsWithStuck,
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    })
  } catch (err) {
    console.error('List complaints error:', err)
    res.status(500).json({ success: false, error: '服务器内部错误' })
  }
})

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params

  try {
    const complaintResult = await pool.query(
      `SELECT c.*, u.name as assignee_name,
        CASE WHEN c.deadline < NOW() AND c.status != 'closed' THEN true ELSE false END as is_overdue
      FROM complaints c
      LEFT JOIN users u ON c.assignee_id = u.id
      WHERE c.id = $1`,
      [id]
    )

    if (complaintResult.rows.length === 0) {
      res.status(404).json({ success: false, error: '投诉不存在' })
      return
    }

    const complaint = complaintResult.rows[0]

    const timelineResult = await pool.query(
      'SELECT * FROM complaint_timeline WHERE complaint_id = $1 ORDER BY created_at',
      [id]
    )

    const evidenceLinksResult = await pool.query(
      'SELECT * FROM evidence_links WHERE complaint_id = $1',
      [id]
    )

    const evidenceReviewResult = await pool.query(
      `SELECT er.*, u.name as reviewer_name FROM evidence_reviews er LEFT JOIN users u ON er.reviewer_id = u.id WHERE er.complaint_id = $1`,
      [id]
    )
    const evidenceReview = evidenceReviewResult.rows[0] || null

    const parkingLogIds: number[] = []
    const rentalIds: number[] = []
    const anomalyIds: number[] = []

    for (const link of evidenceLinksResult.rows) {
      if (link.evidence_type === 'parking_log') parkingLogIds.push(link.evidence_id)
      else if (link.evidence_type === 'monthly_rental') rentalIds.push(link.evidence_id)
      else if (link.evidence_type === 'gate_anomaly') anomalyIds.push(link.evidence_id)
    }

    let parkingLogs: any[] = []
    let monthlyRentals: unknown[] = []
    let gateAnomalies: any[] = []

    if (parkingLogIds.length > 0) {
      const r = await pool.query(
        `SELECT * FROM parking_logs WHERE id = ANY($1)`,
        [parkingLogIds]
      )
      parkingLogs = r.rows.map((row) => ({ ...row, match_mode: 'plate' }))
    }

    if (rentalIds.length > 0) {
      const r = await pool.query(
        `SELECT * FROM monthly_rentals WHERE id = ANY($1)`,
        [rentalIds]
      )
      monthlyRentals = r.rows
    }

    if (anomalyIds.length > 0) {
      const r = await pool.query(
        `SELECT * FROM gate_anomalies WHERE id = ANY($1)`,
        [anomalyIds]
      )
      gateAnomalies = r.rows.map((row) => ({ ...row, match_mode: 'plate' }))
    }

    if (complaint.plate_number) {
      const plateR = await pool.query(
        `SELECT * FROM parking_logs WHERE plate_number = $1 ORDER BY timestamp DESC LIMIT 20`,
        [complaint.plate_number]
      )
      const existingIds = new Set(parkingLogs.map((p) => p.id))
      for (const row of plateR.rows) {
        if (!existingIds.has(row.id)) {
          parkingLogs.push({ ...row, match_mode: 'plate' })
          existingIds.add(row.id)
        }
      }

      const rentalR = await pool.query(
        `SELECT * FROM monthly_rentals WHERE plate_number = $1`,
        [complaint.plate_number]
      )
      monthlyRentals = rentalR.rows
    }

    if (complaint.incident_time && complaint.gate_id) {
      const timeR = await pool.query(
        `SELECT * FROM parking_logs
         WHERE gate_id = $1
           AND timestamp >= $2::timestamp - INTERVAL '2 hours'
           AND timestamp <= $2::timestamp + INTERVAL '2 hours'
         ORDER BY timestamp DESC`,
        [complaint.gate_id, complaint.incident_time]
      )
      const existingIds = new Set(parkingLogs.map((p) => p.id))
      for (const row of timeR.rows) {
        if (!existingIds.has(row.id)) {
          parkingLogs.push({ ...row, match_mode: 'time_gate' })
          existingIds.add(row.id)
        }
      }

      const anomalyR = await pool.query(
        `SELECT * FROM gate_anomalies
         WHERE gate_id = $1
           AND detected_at >= $2::timestamp - INTERVAL '4 hours'
           AND detected_at <= $2::timestamp + INTERVAL '4 hours'
         ORDER BY detected_at DESC`,
        [complaint.gate_id, complaint.incident_time]
      )
      const existingAnomalyIds = new Set(gateAnomalies.map((g) => g.id))
      for (const row of anomalyR.rows) {
        if (!existingAnomalyIds.has(row.id)) {
          gateAnomalies.push({ ...row, match_mode: 'time_gate' })
          existingAnomalyIds.add(row.id)
        }
      }
    }

    if (complaint.gate_id && !complaint.incident_time) {
      const anomalyR = await pool.query(
        `SELECT * FROM gate_anomalies WHERE gate_id = $1 ORDER BY detected_at DESC LIMIT 20`,
        [complaint.gate_id]
      )
      const existingAnomalyIds = new Set(gateAnomalies.map((g) => g.id))
      for (const row of anomalyR.rows) {
        if (!existingAnomalyIds.has(row.id)) {
          gateAnomalies.push({ ...row, match_mode: 'time_gate' })
          existingAnomalyIds.add(row.id)
        }
      }
    }

    const stuckPoint = computeStuckPoint(complaint, evidenceReview)

    res.json({
      success: true,
      data: {
        ...complaint,
        timeline: timelineResult.rows,
        evidence: {
          parking_logs: parkingLogs,
          monthly_rentals: monthlyRentals,
          gate_anomalies: gateAnomalies,
        },
        evidence_review: evidenceReview,
        stuck_point: stuckPoint,
      },
    })
  } catch (err) {
    console.error('Get complaint error:', err)
    res.status(500).json({ success: false, error: '服务器内部错误' })
  }
})

router.post('/', async (req: Request, res: Response): Promise<void> => {
  const { type, plate_number, description, parking_lot_id, deadline, incident_time, gate_id, gate_name } = req.body
  const operator = req.user!

  if (!type || !description || !deadline) {
    res.status(400).json({ success: false, error: '缺少必要字段' })
    return
  }

  try {
    const complaintNo = generateComplaintNo()

    const result = await pool.query(
      `INSERT INTO complaints (complaint_no, type, status, plate_number, description, parking_lot_id, deadline, assignee_id, incident_time, gate_id, gate_name)
       VALUES ($1, $2, 'pending', $3, $4, $5, $6, NULL, $7, $8, $9)
       RETURNING *`,
      [
        complaintNo,
        type,
        plate_number || null,
        description,
        parking_lot_id || 1,
        deadline,
        incident_time || null,
        gate_id || null,
        gate_name || null,
      ]
    )

    const complaint = result.rows[0]

    await addTimeline(complaint.id, 'created', operator, `投诉已创建，类型: ${type}`)

    res.status(201).json({ success: true, data: complaint })
  } catch (err) {
    console.error('Create complaint error:', err)
    res.status(500).json({ success: false, error: '服务器内部错误' })
  }
})

router.patch('/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params
  const { status, assigneeId, appealReason } = req.body
  const operator = req.user!

  try {
    const existing = await pool.query('SELECT * FROM complaints WHERE id = $1', [id])
    if (existing.rows.length === 0) {
      res.status(404).json({ success: false, error: '投诉不存在' })
      return
    }

    const current = existing.rows[0]
    const updates: string[] = []
    const params: unknown[] = []
    let paramIdx = 1

    if (status !== undefined) {
      params.push(status)
      updates.push(`status = $${paramIdx++}`)
    }

    if (assigneeId !== undefined) {
      params.push(assigneeId)
      updates.push(`assignee_id = $${paramIdx++}`)
    }

    const shouldSetAppealedAt = !current.appealed_at && (
      (appealReason !== undefined && appealReason) ||
      (status === 'appealing')
    )

    if (appealReason !== undefined) {
      params.push(appealReason)
      updates.push(`appeal_reason = $${paramIdx++}`)
    }

    if (shouldSetAppealedAt) {
      updates.push(`appealed_at = NOW()`)
    }

    updates.push(`updated_at = NOW()`)
    params.push(id)

    await pool.query(
      `UPDATE complaints SET ${updates.join(', ')} WHERE id = $${paramIdx}`,
      params
    )

    if (status && status !== current.status) {
      const statusLabels: Record<string, string> = {
        pending: '待处理',
        assigned: '已分配',
        processing: '处理中',
        appealing: '申诉中',
        rejected: '已退回',
        closed: '已关闭',
      }
      await addTimeline(
        Number(id),
        `status_changed`,
        operator,
        `状态变更为: ${statusLabels[status] || status}`
      )
    }

    if (assigneeId !== undefined && assigneeId !== current.assignee_id) {
      const assigneeResult = await pool.query('SELECT name FROM users WHERE id = $1', [assigneeId])
      const assigneeName = assigneeResult.rows[0]?.name || '未知'
      await addTimeline(
        Number(id),
        'assigned',
        operator,
        `分配给: ${assigneeName}`
      )
    }

    if (appealReason) {
      await addTimeline(
        Number(id),
        'appeal_submitted',
        operator,
        `申诉理由: ${appealReason}`
      )
    }

    const updated = await pool.query(
      `SELECT c.*, u.name as assignee_name,
        CASE WHEN c.deadline < NOW() AND c.status != 'closed' THEN true ELSE false END as is_overdue
      FROM complaints c
      LEFT JOIN users u ON c.assignee_id = u.id
      WHERE c.id = $1`,
      [id]
    )

    res.json({ success: true, data: updated.rows[0] })
  } catch (err) {
    console.error('Update complaint error:', err)
    res.status(500).json({ success: false, error: '服务器内部错误' })
  }
})

router.post('/batch', async (req: Request, res: Response): Promise<void> => {
  const { action, ids, assigneeId } = req.body
  const operator = req.user!

  if (!action || !ids || !Array.isArray(ids) || ids.length === 0) {
    res.status(400).json({ success: false, error: '缺少必要参数' })
    return
  }

  try {
    let newStatus: string | null = null
    let timelineAction = ''
    let timelineDetail = ''

    switch (action) {
      case 'assign':
        newStatus = 'assigned'
        timelineAction = 'batch_assigned'
        timelineDetail = '批量分配'
        break
      case 'process':
        newStatus = 'processing'
        timelineAction = 'batch_processing'
        timelineDetail = '批量开始处理'
        break
      case 'close':
        newStatus = 'closed'
        timelineAction = 'batch_closed'
        timelineDetail = '批量关闭'
        break
      default:
        res.status(400).json({ success: false, error: '无效的批量操作' })
        return
    }

    if (newStatus) {
      await pool.query(
        `UPDATE complaints SET status = $1, updated_at = NOW() WHERE id = ANY($2)`,
        [newStatus, ids]
      )
    }

    if (action === 'assign' && assigneeId) {
      await pool.query(
        `UPDATE complaints SET assignee_id = $1 WHERE id = ANY($2)`,
        [assigneeId, ids]
      )
      const assigneeResult = await pool.query('SELECT name FROM users WHERE id = $1', [assigneeId])
      const assigneeName = assigneeResult.rows[0]?.name || '未知'
      timelineDetail = `批量分配给: ${assigneeName}`
    }

    for (const complaintId of ids) {
      await addTimeline(complaintId, timelineAction, operator, timelineDetail)
    }

    const result = await pool.query(
      `SELECT c.*, u.name as assignee_name,
        CASE WHEN c.deadline < NOW() AND c.status != 'closed' THEN true ELSE false END as is_overdue
      FROM complaints c
      LEFT JOIN users u ON c.assignee_id = u.id
      WHERE c.id = ANY($1)
      ORDER BY c.created_at DESC`,
      [ids]
    )

    res.json({ success: true, data: result.rows })
  } catch (err) {
    console.error('Batch operation error:', err)
    res.status(500).json({ success: false, error: '服务器内部错误' })
  }
})

export default router
