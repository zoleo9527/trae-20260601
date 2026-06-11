import pool from 'api/db'
import type {
  Complaint,
  ComplaintStatus,
  ComplaintType,
  ParkingLog,
  MonthlyRental,
  GateAnomaly,
  TimelineEvent,
  User,
} from 'shared/types'

export interface ComplaintListFilters {
  status?: ComplaintStatus
  type?: ComplaintType
  assignee_id?: number
  group?: string
  page?: number
  limit?: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

export interface ComplaintListResult {
  items: (Complaint & {
    assignee_name: string | null
    is_overdue: boolean
    stuck_point: string | null
    evidence_review_status: string | null
  })[]
  total: number
  page: number
  limit: number
  totalPages: number
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

async function addTimeline(
  complaintId: number,
  action: string,
  operator: User,
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

export async function getComplaintList(
  filters: ComplaintListFilters = {}
): Promise<ComplaintListResult> {
  const {
    status,
    type,
    assignee_id,
    group,
    page = 1,
    limit = 20,
    sort_by = 'created_at',
    sort_order = 'desc',
  } = filters

  const conditions: string[] = []
  const params: any[] = []

  if (group === 'today') {
    conditions.push('c.created_at >= CURRENT_DATE')
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
    if (assignee_id) {
      params.push(assignee_id)
      conditions.push(`c.assignee_id = $${params.length}`)
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

  const validSort = ['created_at', 'updated_at', 'deadline', 'status', 'complaint_no'].includes(sort_by)
    ? sort_by
    : 'created_at'
  const validOrder = sort_order === 'asc' ? 'ASC' : 'DESC'

  params.push(limitNum, offset)

  const result = await pool.query(
    `SELECT c.*, u.name as assignee_name,
       CASE WHEN c.deadline < NOW() AND c.status != 'closed' THEN true ELSE false END as is_overdue
     FROM complaints c
     LEFT JOIN users u ON c.assignee_id = u.id
     ${whereClause}
     ORDER BY c.${validSort} ${validOrder}
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  )

  const complaintIds = result.rows.map((r) => r.id)
  let evidenceReviews: any[] = []
  if (complaintIds.length > 0) {
    const erResult = await pool.query(
      'SELECT er.*, u.name as reviewer_name FROM evidence_reviews er LEFT JOIN users u ON er.reviewer_id = u.id WHERE er.complaint_id = ANY($1)',
      [complaintIds]
    )
    evidenceReviews = erResult.rows
  }

  const items = result.rows.map((c) => {
    const er = evidenceReviews.find((r) => r.complaint_id === c.id) || null
    return {
      ...c,
      stuck_point: computeStuckPoint(c, er),
      evidence_review_status: er ? er.status : null,
    }
  })

  return {
    items,
    total,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil(total / limitNum),
  }
}

export async function getComplaintDetail(id: number): Promise<any | null> {
  const result = await pool.query(
    `SELECT c.*, u.name as assignee_name,
       CASE WHEN c.deadline < NOW() AND c.status != 'closed' THEN true ELSE false END as is_overdue
     FROM complaints c
     LEFT JOIN users u ON c.assignee_id = u.id
     WHERE c.id = $1`,
    [id]
  )
  if (result.rows.length === 0) return null

  const complaint = result.rows[0]

  const timelineResult = await pool.query(
    'SELECT * FROM complaint_timeline WHERE complaint_id = $1 ORDER BY created_at',
    [id]
  )
  const timeline: TimelineEvent[] = timelineResult.rows.map((row) => ({
    ...row,
    operator_role: row.operator_role,
  })) as TimelineEvent[]

  const evidenceLinksResult = await pool.query(
    'SELECT * FROM evidence_links WHERE complaint_id = $1',
    [id]
  )

  const evidenceReviewResult = await pool.query(
    `SELECT er.*, u.name as reviewer_name FROM evidence_reviews er LEFT JOIN users u ON er.reviewer_id = u.id WHERE er.complaint_id = $1`,
    [id]
  )
  const evidenceReviews = evidenceReviewResult.rows

  const parkingLogIds: number[] = []
  const rentalIds: number[] = []
  const anomalyIds: number[] = []

  for (const link of evidenceLinksResult.rows) {
    if (link.evidence_type === 'parking_log') parkingLogIds.push(link.evidence_id)
    else if (link.evidence_type === 'monthly_rental') rentalIds.push(link.evidence_id)
    else if (link.evidence_type === 'gate_anomaly') anomalyIds.push(link.evidence_id)
  }

  let parkingLogs: (ParkingLog & { match_mode?: string | null })[] = []
  let monthlyRentals: MonthlyRental[] = []
  let gateAnomalies: (GateAnomaly & { match_mode?: string | null })[] = []

  if (parkingLogIds.length > 0) {
    const r = await pool.query(`SELECT * FROM parking_logs WHERE id = ANY($1)`, [parkingLogIds])
    parkingLogs = r.rows.map((row) => ({ ...row, match_mode: 'plate' }))
  }
  if (rentalIds.length > 0) {
    const r = await pool.query(`SELECT * FROM monthly_rentals WHERE id = ANY($1)`, [rentalIds])
    monthlyRentals = r.rows
  }
  if (anomalyIds.length > 0) {
    const r = await pool.query(`SELECT * FROM gate_anomalies WHERE id = ANY($1)`, [anomalyIds])
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

    const plateRentals = await pool.query(
      `SELECT * FROM monthly_rentals WHERE plate_number = $1`,
      [complaint.plate_number]
    )
    const existingRentalIds = new Set(monthlyRentals.map((r) => r.id))
    for (const row of plateRentals.rows) {
      if (!existingRentalIds.has(row.id)) {
        monthlyRentals.push(row)
        existingRentalIds.add(row.id)
      }
    }
  }

  if (complaint.incident_time && complaint.gate_id) {
    const timeLogs = await pool.query(
      `SELECT * FROM parking_logs
       WHERE gate_id = $1
         AND timestamp >= $2::timestamp - INTERVAL '2 hours'
         AND timestamp <= $2::timestamp + INTERVAL '2 hours'
       ORDER BY timestamp DESC`,
      [complaint.gate_id, complaint.incident_time]
    )
    const existingIds = new Set(parkingLogs.map((p) => p.id))
    for (const row of timeLogs.rows) {
      if (!existingIds.has(row.id)) {
        parkingLogs.push({ ...row, match_mode: 'time_gate' })
        existingIds.add(row.id)
      }
    }

    const timeAnomalies = await pool.query(
      `SELECT * FROM gate_anomalies
       WHERE gate_id = $1
         AND detected_at >= $2::timestamp - INTERVAL '4 hours'
         AND detected_at <= $2::timestamp + INTERVAL '4 hours'
       ORDER BY detected_at DESC`,
      [complaint.gate_id, complaint.incident_time]
    )
    const existingAnomalyIds = new Set(gateAnomalies.map((g) => g.id))
    for (const row of timeAnomalies.rows) {
      if (!existingAnomalyIds.has(row.id)) {
        gateAnomalies.push({ ...row, match_mode: 'time_gate' })
        existingAnomalyIds.add(row.id)
      }
    }
  }

  if (complaint.gate_id && !complaint.incident_time) {
    const gateAnomaliesRecent = await pool.query(
      `SELECT * FROM gate_anomalies WHERE gate_id = $1 ORDER BY detected_at DESC LIMIT 20`,
      [complaint.gate_id]
    )
    const existingAnomalyIds = new Set(gateAnomalies.map((g) => g.id))
    for (const row of gateAnomaliesRecent.rows) {
      if (!existingAnomalyIds.has(row.id)) {
        gateAnomalies.push({ ...row, match_mode: 'time_gate' })
        existingAnomalyIds.add(row.id)
      }
    }
  }

  const latestReview = evidenceReviews.length > 0 ? evidenceReviews[0] : null
  const stuckPoint = computeStuckPoint(complaint, latestReview)

  return {
    complaint,
    timeline,
    evidence: {
      parking_logs: parkingLogs,
      monthly_rentals: monthlyRentals,
      gate_anomalies: gateAnomalies,
    },
    evidence_reviews: evidenceReviews,
    stuck_point: stuckPoint,
  }
}

export async function createComplaint(data: {
  type: ComplaintType
  plate_number: string | null
  description: string
  parking_lot_id: number
  deadline: string
  incident_time?: string | null
  gate_id?: number | null
  gate_name?: string | null
  creator_id: number
}): Promise<any> {
  const complaint_no = generateComplaintNo()

  const result = await pool.query(
    `INSERT INTO complaints (complaint_no, type, status, plate_number, description,
       parking_lot_id, deadline, assignee_id, incident_time, gate_id, gate_name)
     VALUES ($1, $2, 'pending', $3, $4, $5, $6, NULL, $7, $8, $9)
     RETURNING *`,
    [
      complaint_no,
      data.type,
      data.plate_number,
      data.description,
      data.parking_lot_id,
      data.deadline,
      data.incident_time || null,
      data.gate_id || null,
      data.gate_name || null,
    ]
  )

  const complaint = result.rows[0]

  const creatorResult = await pool.query(
    'SELECT id, username, name, role FROM users WHERE id = $1',
    [data.creator_id]
  )
  const creator = creatorResult.rows[0] as User

  await addTimeline(complaint.id, 'created', creator, '投诉已创建')

  return {
    ...complaint,
    assignee_name: null,
  }
}

export async function updateComplaint(
  id: number,
  updates: {
    status?: ComplaintStatus
    assignee_id?: number | null
    description?: string
    appeal_reason?: string
    deadline?: string
    incident_time?: string | null
    gate_id?: number | null
    gate_name?: string | null
  },
  operator_id: number
): Promise<any> {
  const currentResult = await pool.query('SELECT * FROM complaints WHERE id = $1', [id])
  if (currentResult.rows.length === 0) return null
  const current = currentResult.rows[0]

  const operatorResult = await pool.query(
    'SELECT id, username, name, role FROM users WHERE id = $1',
    [operator_id]
  )
  const operator = operatorResult.rows[0] as User

  const fields: string[] = []
  const params: any[] = []
  let paramIdx = 1

  if (updates.status !== undefined) {
    fields.push(`status = $${paramIdx++}`)
    params.push(updates.status)
  }
  if (updates.assignee_id !== undefined) {
    fields.push(`assignee_id = $${paramIdx++}`)
    params.push(updates.assignee_id)
  }
  if (updates.description !== undefined) {
    fields.push(`description = $${paramIdx++}`)
    params.push(updates.description)
  }
  if (updates.deadline !== undefined) {
    fields.push(`deadline = $${paramIdx++}`)
    params.push(updates.deadline)
  }
  if (updates.incident_time !== undefined) {
    fields.push(`incident_time = $${paramIdx++}`)
    params.push(updates.incident_time)
  }
  if (updates.gate_id !== undefined) {
    fields.push(`gate_id = $${paramIdx++}`)
    params.push(updates.gate_id)
  }
  if (updates.gate_name !== undefined) {
    fields.push(`gate_name = $${paramIdx++}`)
    params.push(updates.gate_name)
  }

  const shouldSetAppealedAt =
    !current.appealed_at &&
    ((updates.appeal_reason !== undefined && updates.appeal_reason) ||
      updates.status === 'appealing')

  if (updates.appeal_reason !== undefined) {
    fields.push(`appeal_reason = $${paramIdx++}`)
    params.push(updates.appeal_reason)
  }

  if (shouldSetAppealedAt) {
    fields.push(`appealed_at = NOW()`)
  }

  fields.push(`updated_at = NOW()`)

  params.push(id)
  const result = await pool.query(
    `UPDATE complaints SET ${fields.join(', ')} WHERE id = $${paramIdx} RETURNING *`,
    params
  )

  const updated = result.rows[0]

  if (updates.status && updates.status !== current.status) {
    await addTimeline(
      id,
      'status_changed',
      operator,
      `状态从 ${current.status} 变为 ${updates.status}`
    )
  }

  if (updates.assignee_id !== undefined && updates.assignee_id !== current.assignee_id) {
    let detail = ''
    if (updates.assignee_id) {
      const uResult = await pool.query('SELECT name FROM users WHERE id = $1', [
        updates.assignee_id,
      ])
      detail = `指派给 ${uResult.rows[0]?.name || '未知用户'}`
    } else {
      detail = '取消指派'
    }
    await addTimeline(id, 'assigned', operator, detail)
  }

  if (updates.appeal_reason && updates.appeal_reason !== current.appeal_reason) {
    await addTimeline(id, 'appeal_submitted', operator, updates.appeal_reason)
  }

  return updated
}

export async function batchUpdateComplaints(
  ids: number[],
  updates: { status?: ComplaintStatus; assignee_id?: number | null },
  operator_id: number
): Promise<number> {
  let updated = 0
  for (const id of ids) {
    const result = await updateComplaint(id, updates, operator_id)
    if (result) updated++
  }
  return updated
}

export async function getDashboardStats(): Promise<any> {
  const todayResult = await pool.query(
    `SELECT COUNT(*) as count FROM complaints WHERE created_at >= CURRENT_DATE`
  )

  const overdueResult = await pool.query(
    `SELECT COUNT(*) as count FROM complaints WHERE deadline < NOW() AND status != 'closed'`
  )

  const pendingResult = await pool.query(
    `SELECT COUNT(*) as count FROM complaints WHERE status = 'pending' AND assignee_id IS NULL`
  )

  const rejectedResult = await pool.query(
    `SELECT COUNT(*) as count FROM complaints WHERE status = 'rejected' AND updated_at >= NOW() - INTERVAL '24 hours'`
  )

  return {
    today_tasks: parseInt(todayResult.rows[0].count, 10),
    overdue: parseInt(overdueResult.rows[0].count, 10),
    unassigned: parseInt(pendingResult.rows[0].count, 10),
    recently_returned: parseInt(rejectedResult.rows[0].count, 10),
  }
}

export async function updateEvidenceReview(
  complaintId: number,
  reviewer_id: number,
  reviewData: { status: string; notes?: string; blocked_reason?: string }
): Promise<any> {
  const existingResult = await pool.query(
    'SELECT * FROM evidence_reviews WHERE complaint_id = $1',
    [complaintId]
  )

  const reviewerResult = await pool.query(
    'SELECT id, username, name, role FROM users WHERE id = $1',
    [reviewer_id]
  )
  const reviewer = reviewerResult.rows[0] as User

  const completedAt = reviewData.status === 'completed' ? new Date().toISOString() : null

  let result
  if (existingResult.rows.length > 0) {
    const currentCompletedAt = existingResult.rows[0].completed_at
    const finalCompletedAt = completedAt || currentCompletedAt
    result = await pool.query(
      `UPDATE evidence_reviews
       SET status = $2, blocked_reason = $3, notes = $4, reviewer_id = $5, updated_at = NOW(),
           completed_at = $6, reviewed_at = NOW()
       WHERE complaint_id = $1
       RETURNING *`,
      [
        complaintId,
        reviewData.status,
        reviewData.blocked_reason || null,
        reviewData.notes || null,
        reviewer_id,
        finalCompletedAt,
      ]
    )
  } else {
    result = await pool.query(
      `INSERT INTO evidence_reviews (complaint_id, reviewer_id, status, blocked_reason, notes, completed_at, reviewed_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING *`,
      [
        complaintId,
        reviewer_id,
        reviewData.status,
        reviewData.blocked_reason || null,
        reviewData.notes || null,
        completedAt,
      ]
    )
  }

  const action =
    reviewData.status === 'completed'
      ? 'evidence_review_updated'
      : reviewData.status === 'blocked'
      ? 'evidence_review_updated'
      : 'evidence_review_started'
  const detail = `证据回查状态更新为 ${reviewData.status}${
    reviewData.notes ? `：${reviewData.notes}` : ''
  }`
  await addTimeline(complaintId, action, reviewer, detail)

  return result.rows[0]
}
