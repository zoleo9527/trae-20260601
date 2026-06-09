import { Router, type Response } from 'express'
import db from '../db.js'
import { verifyToken, requireRole, type RequestWithUser } from '../middleware/auth.js'

const router = Router()

router.use(verifyToken)

interface ReturnRow {
  id: number
  tracking_no: string
  reason: string
  status: string
  created_by: number
  assigned_to: number | null
  created_at: string
  updated_at: string
}

interface LogRow {
  id: number
  return_id: number
  from_status: string | null
  to_status: string
  operator_id: number
  operator_role: string
  operator_name: string
  action: string
  remark: string | null
  created_at: string
}

interface ReviewRow {
  id: number
  return_id: number
  conclusion: string
  improvement: string | null
  operator_id: number
  operator_role: string
  operator_name: string
  created_at: string
}

const ACTION_STATUS_MAP: Record<string, { targetStatus: string; allowedRole: string; fromStatus: string; updateAssignedTo: 'self' | 'creator' | 'clear' | 'keep' }> = {
  confirm: { targetStatus: '待驿站认定', allowedRole: '派件员', fromStatus: '待派件员确认', updateAssignedTo: 'self' },
  reject: { targetStatus: '已驳回-待补录', allowedRole: '驿站负责人', fromStatus: '待驿站认定', updateAssignedTo: 'keep' },
  approve: { targetStatus: '退回处理完成', allowedRole: '驿站负责人', fromStatus: '待驿站认定', updateAssignedTo: 'keep' },
  supplement: { targetStatus: '待驿站认定', allowedRole: '派件员', fromStatus: '已驳回-待补录', updateAssignedTo: 'self' },
  'reject-to-kefu': { targetStatus: '已驳回-待客服补录', allowedRole: '派件员', fromStatus: '已驳回-待补录', updateAssignedTo: 'creator' },
  'supplement-kefu': { targetStatus: '待派件员确认', allowedRole: '客服', fromStatus: '已驳回-待客服补录', updateAssignedTo: 'clear' },
}

const actionLabelMap: Record<string, string> = {
  confirm: '派件员确认',
  reject: '驿站驳回',
  approve: '驿站认定通过',
  supplement: '派件员补录',
  'reject-to-kefu': '派件员驳回至客服',
  'supplement-kefu': '客服补录',
}

function formatReturnDetail(returnItem: ReturnRow, logs: LogRow[], reviews: ReviewRow[]) {
  const creator = db.prepare('SELECT display_name FROM users WHERE id = ?').get(returnItem.created_by) as { display_name: string } | undefined
  const assignee = returnItem.assigned_to
    ? db.prepare('SELECT display_name FROM users WHERE id = ?').get(returnItem.assigned_to) as { display_name: string } | undefined
    : null

  return {
    id: returnItem.id,
    trackingNo: returnItem.tracking_no,
    reason: returnItem.reason,
    status: returnItem.status,
    createdBy: returnItem.created_by,
    createdByName: creator?.display_name || null,
    assignedTo: returnItem.assigned_to,
    assignedToName: assignee?.display_name || null,
    createdAt: returnItem.created_at,
    updatedAt: returnItem.updated_at,
    logs: logs.map(log => ({
      id: log.id,
      returnId: log.return_id,
      fromStatus: log.from_status,
      toStatus: log.to_status,
      operatorId: log.operator_id,
      operatorRole: log.operator_role,
      operatorName: log.operator_name,
      action: log.action,
      remark: log.remark,
      createdAt: log.created_at,
    })),
    reviews: reviews.map(review => ({
      id: review.id,
      returnId: review.return_id,
      conclusion: review.conclusion,
      improvement: review.improvement,
      operatorId: review.operator_id,
      operatorRole: review.operator_role,
      operatorName: review.operator_name,
      createdAt: review.created_at,
    })),
  }
}

router.get('/', (req: RequestWithUser, res: Response): void => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1)
  const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string) || 20))
  const status = req.query.status as string | undefined
  const keyword = req.query.keyword as string | undefined
  const assigneeId = req.query.assigneeId as string | undefined
  const startDate = req.query.startDate as string | undefined
  const endDate = req.query.endDate as string | undefined
  const offset = (page - 1) * pageSize

  let whereClauses: string[] = []
  let whereParams: any[] = []

  if (keyword) {
    whereClauses.push('r.tracking_no LIKE ?')
    whereParams.push(`%${keyword}%`)
  }

  if (status) {
    whereClauses.push('r.status = ?')
    whereParams.push(status)
  }

  if (assigneeId) {
    const aid = parseInt(assigneeId)
    if (!isNaN(aid)) {
      whereClauses.push('r.assigned_to = ?')
      whereParams.push(aid)
    }
  }

  if (startDate) {
    whereClauses.push('r.updated_at >= ?')
    whereParams.push(startDate)
  }

  if (endDate) {
    whereClauses.push('r.updated_at <= ?')
    whereParams.push(endDate + ' 23:59:59')
  }

  if (req.user.role === '客服') {
    whereClauses.push('r.created_by = ?')
    whereParams.push(req.user.id)
  } else if (req.user.role === '派件员') {
    whereClauses.push('(r.assigned_to = ? OR r.status = ?)')
    whereParams.push(req.user.id, '待派件员确认')
  }

  const whereStr = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : ''

  const countRow = db.prepare(`SELECT COUNT(*) as total FROM returns r ${whereStr}`).get(...whereParams) as { total: number }

  const list = db.prepare(
    `SELECT r.*, u.display_name as created_by_name, a.display_name as assigned_to_name
     FROM returns r
     LEFT JOIN users u ON r.created_by = u.id
     LEFT JOIN users a ON r.assigned_to = a.id
     ${whereStr}
     ORDER BY r.updated_at DESC
     LIMIT ? OFFSET ?`
  ).all(...whereParams, pageSize, offset) as any[]

  const statsWhereStr = whereClauses.length > 0 ? 'WHERE ' + whereClauses.map(c => c.replace(/^r\./, '')).join(' AND ') : ''
  const statsRows = db.prepare(
    `SELECT status, COUNT(*) as count FROM returns ${statsWhereStr} GROUP BY status`
  ).all(...whereParams) as { status: string; count: number }[]

  const statusStats: Record<string, number> = {}
  for (const row of statsRows) {
    statusStats[row.status] = row.count
  }

  res.status(200).json({
    success: true,
    data: {
      list: list.map(item => ({
        id: item.id,
        trackingNo: item.tracking_no,
        reason: item.reason,
        status: item.status,
        createdBy: item.created_by,
        createdByName: item.created_by_name,
        assignedTo: item.assigned_to,
        assignedToName: item.assigned_to_name,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      })),
      total: countRow.total,
      page,
      pageSize,
      statusStats,
    },
  })
})

router.post('/', requireRole('客服'), (req: RequestWithUser, res: Response): void => {
  const { trackingNo, reason, remark } = req.body

  if (!trackingNo || !reason) {
    res.status(400).json({ success: false, error: '请提供快递单号和退回原因' })
    return
  }

  const insertReturn = db.prepare(
    `INSERT INTO returns (tracking_no, reason, status, created_by, assigned_to) VALUES (?, ?, ?, ?, ?)`
  )
  const insertLog = db.prepare(
    `INSERT INTO return_logs (return_id, from_status, to_status, operator_id, operator_role, operator_name, action, remark) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  )

  const transaction = db.transaction(() => {
    const result = insertReturn.run(trackingNo, reason, '待派件员确认', req.user.id, null)
    const returnId = result.lastInsertRowid as number

    insertLog.run(
      returnId,
      null,
      '待派件员确认',
      req.user.id,
      req.user.role,
      req.user.displayName,
      '创建退回单',
      remark || null
    )

    return returnId
  })

  const returnId = transaction()

  const returnItem = db.prepare('SELECT * FROM returns WHERE id = ?').get(returnId) as ReturnRow

  res.status(200).json({
    success: true,
    data: {
      id: returnItem.id,
      trackingNo: returnItem.tracking_no,
      reason: returnItem.reason,
      status: returnItem.status,
      createdBy: returnItem.created_by,
      assignedTo: returnItem.assigned_to,
      createdAt: returnItem.created_at,
      updatedAt: returnItem.updated_at,
    },
  })
})

router.get('/:id', (req: RequestWithUser, res: Response): void => {
  const returnItem = db.prepare('SELECT * FROM returns WHERE id = ?').get(req.params.id) as ReturnRow | undefined

  if (!returnItem) {
    res.status(404).json({ success: false, error: '退回单不存在' })
    return
  }

  const logs = db.prepare('SELECT * FROM return_logs WHERE return_id = ? ORDER BY created_at ASC').all(returnItem.id) as LogRow[]
  const reviews = db.prepare('SELECT * FROM reviews WHERE return_id = ? ORDER BY created_at ASC').all(returnItem.id) as ReviewRow[]

  res.status(200).json({
    success: true,
    data: formatReturnDetail(returnItem, logs, reviews),
  })
})

router.put('/:id/process', (req: RequestWithUser, res: Response): void => {
  const { action, remark } = req.body

  if (!action) {
    res.status(400).json({ success: false, error: '请提供操作类型' })
    return
  }

  const transition = ACTION_STATUS_MAP[action]
  if (!transition) {
    res.status(400).json({ success: false, error: '无效的操作类型' })
    return
  }

  const returnItem = db.prepare('SELECT * FROM returns WHERE id = ?').get(req.params.id) as ReturnRow | undefined
  if (!returnItem) {
    res.status(404).json({ success: false, error: '退回单不存在' })
    return
  }

  if (returnItem.status !== transition.fromStatus) {
    res.status(400).json({ success: false, error: `当前状态为"${returnItem.status}"，无法执行此操作` })
    return
  }

  if (req.user.role !== transition.allowedRole) {
    res.status(403).json({ success: false, error: `仅${transition.allowedRole}可执行此操作` })
    return
  }

  const resolveAssignedTo = (): number | null => {
    switch (transition.updateAssignedTo) {
      case 'self': return req.user.id
      case 'creator': return returnItem.created_by
      case 'clear': return null
      case 'keep': return returnItem.assigned_to
      default: return returnItem.assigned_to
    }
  }

  const updateReturn = db.prepare(
    `UPDATE returns SET status = ?, assigned_to = ?, updated_at = datetime('now', 'localtime') WHERE id = ?`
  )
  const insertLog = db.prepare(
    `INSERT INTO return_logs (return_id, from_status, to_status, operator_id, operator_role, operator_name, action, remark) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  )

  const transaction = db.transaction(() => {
    const newAssignedTo = resolveAssignedTo()
    updateReturn.run(transition.targetStatus, newAssignedTo, returnItem.id)
    insertLog.run(
      returnItem.id,
      returnItem.status,
      transition.targetStatus,
      req.user.id,
      req.user.role,
      req.user.displayName,
      actionLabelMap[action] || action,
      remark || null
    )
  })

  transaction()

  const updatedItem = db.prepare('SELECT * FROM returns WHERE id = ?').get(req.params.id) as ReturnRow
  const logs = db.prepare('SELECT * FROM return_logs WHERE return_id = ? ORDER BY created_at ASC').all(req.params.id) as LogRow[]
  const reviews = db.prepare('SELECT * FROM reviews WHERE return_id = ? ORDER BY created_at ASC').all(req.params.id) as ReviewRow[]

  res.status(200).json({
    success: true,
    data: formatReturnDetail(updatedItem, logs, reviews),
  })
})

router.post('/:id/review', requireRole('驿站负责人'), (req: RequestWithUser, res: Response): void => {
  const { conclusion, improvement } = req.body

  if (!conclusion) {
    res.status(400).json({ success: false, error: '请提供复盘结论' })
    return
  }

  const returnItem = db.prepare('SELECT * FROM returns WHERE id = ?').get(req.params.id) as ReturnRow | undefined

  if (!returnItem) {
    res.status(404).json({ success: false, error: '退回单不存在' })
    return
  }

  if (returnItem.status !== '退回处理完成' && returnItem.status !== '复盘进行中') {
    res.status(400).json({ success: false, error: '仅状态为"退回处理完成"或"复盘进行中"的退回单可进行复盘' })
    return
  }

  const insertReview = db.prepare(
    `INSERT INTO reviews (return_id, conclusion, improvement, operator_id, operator_role, operator_name) VALUES (?, ?, ?, ?, ?, ?)`
  )
  const updateReturn = db.prepare(
    `UPDATE returns SET status = ?, updated_at = datetime('now', 'localtime') WHERE id = ?`
  )
  const insertLog = db.prepare(
    `INSERT INTO return_logs (return_id, from_status, to_status, operator_id, operator_role, operator_name, action, remark) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  )

  const transaction = db.transaction(() => {
    if (returnItem.status === '退回处理完成') {
      updateReturn.run('复盘进行中', returnItem.id)
      insertLog.run(
        returnItem.id,
        returnItem.status,
        '复盘进行中',
        req.user.id,
        req.user.role,
        req.user.displayName,
        '开始复盘',
        null
      )
    } else if (returnItem.status === '复盘进行中') {
      updateReturn.run('复盘完成', returnItem.id)
      insertLog.run(
        returnItem.id,
        returnItem.status,
        '复盘完成',
        req.user.id,
        req.user.role,
        req.user.displayName,
        '追加复盘',
        null
      )
    }

    insertReview.run(returnItem.id, conclusion, improvement || null, req.user.id, req.user.role, req.user.displayName)
  })

  transaction()

  const updatedItem = db.prepare('SELECT * FROM returns WHERE id = ?').get(req.params.id) as ReturnRow
  const logs = db.prepare('SELECT * FROM return_logs WHERE return_id = ? ORDER BY created_at ASC').all(req.params.id) as LogRow[]
  const reviews = db.prepare('SELECT * FROM reviews WHERE return_id = ? ORDER BY created_at ASC').all(req.params.id) as ReviewRow[]

  res.status(200).json({
    success: true,
    data: formatReturnDetail(updatedItem, logs, reviews),
  })
})

export default router
