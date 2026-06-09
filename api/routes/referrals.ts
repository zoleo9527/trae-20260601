import { Router, type Request, type Response } from 'express'
import { getDb } from '../db.js'
import { verifyToken } from './auth.js'

const router = Router()

function authGuard(req: Request, res: Response): { userId: number; role: string } | null {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null
  const token = authHeader.slice(7)
  return verifyToken(token)
}

type Status = 'draft' | 'pending_review' | 'approved' | 'rejected' | 'sent' | 'result_returned' | 'change_alerted' | 'confirmed' | 'closed'

interface TransitionRule {
  allowedRoles: string[]
  fromStatuses: Status[]
  label: string
}

const TRANSITION_RULES: Record<Status, TransitionRule> = {
  pending_review: {
    allowedRoles: ['gp'],
    fromStatuses: ['draft', 'rejected'],
    label: '提交审核',
  },
  approved: {
    allowedRoles: ['nurse'],
    fromStatuses: ['pending_review'],
    label: '审核通过',
  },
  rejected: {
    allowedRoles: ['nurse'],
    fromStatuses: ['pending_review'],
    label: '驳回',
  },
  sent: {
    allowedRoles: ['nurse'],
    fromStatuses: ['approved'],
    label: '发送至上级医院',
  },
  result_returned: {
    allowedRoles: [],
    fromStatuses: ['sent'],
    label: '结果回传',
  },
  change_alerted: {
    allowedRoles: [],
    fromStatuses: ['sent', 'result_returned', 'change_alerted'],
    label: '变更提醒',
  },
  confirmed: {
    allowedRoles: [],
    fromStatuses: ['result_returned', 'change_alerted'],
    label: '确认签收',
  },
  closed: {
    allowedRoles: ['pho'],
    fromStatuses: ['confirmed'],
    label: '标记闭环',
  },
  draft: {
    allowedRoles: [],
    fromStatuses: [],
    label: '创建草稿',
  },
}

const EDIT_ALLOWED_STATUSES: Status[] = ['draft', 'rejected', 'pending_review', 'sent', 'change_alerted']
const EDIT_ALLOWED_ROLES: string[] = ['gp']
const EDIT_TRIGGER_CHANGE_STATUSES: Status[] = ['sent', 'change_alerted']

const FIELD_LABELS: Record<string, string> = {
  reason: '转诊原因',
  targetDept: '拟转科室',
  urgency: '紧急程度',
  expectedReturnDays: '预期回传天数',
}

function mapReferral(row: any) {
  return {
    id: row.id,
    patientName: row.patient_name,
    patientAge: row.patient_age,
    patientGender: row.patient_gender,
    reason: row.reason,
    targetDept: row.target_dept,
    urgency: row.urgency,
    expectedReturnDays: row.expected_return_days,
    status: row.status,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    version: row.version,
  }
}

function mapStatusChange(row: any) {
  return {
    id: row.id,
    referralId: row.referral_id,
    fromStatus: row.from_status,
    toStatus: row.to_status,
    operatorId: row.operator_id,
    operatorRole: row.operator_role,
    operatorName: row.operator_name,
    note: row.note,
    createdAt: row.created_at,
  }
}

function mapSnapshot(row: any) {
  return {
    id: row.id,
    referralId: row.referral_id,
    field: row.field,
    oldValue: row.old_value,
    newValue: row.new_value,
    operatorId: row.operator_id,
    operatorName: row.operator_name,
    note: row.note,
    createdAt: row.created_at,
  }
}

function roleLabel(role: string): string {
  const map: Record<string, string> = { gp: '全科医生', nurse: '护士', pho: '公共卫生专员' }
  return map[role] || role
}

router.get('/', (req: Request, res: Response): void => {
  const auth = authGuard(req, res)
  if (!auth) { res.status(401).json({ message: '未登录' }); return }

  const db = getDb()
  const { status, role, page = '1', limit = '20' } = req.query
  const pageNum = Number(page)
  const limitNum = Number(limit)
  const offset = (pageNum - 1) * limitNum

  let whereClause = '1=1'
  const params: any[] = []

  if (status) {
    whereClause += ' AND status = ?'
    params.push(status)
  }
  if (role === 'gp') {
    whereClause += ' AND created_by = ?'
    params.push(auth.userId)
  }

  const countRow = db.prepare(`SELECT COUNT(*) as total FROM referrals WHERE ${whereClause}`).get(...params) as { total: number }
  const rows = db.prepare(`SELECT * FROM referrals WHERE ${whereClause} ORDER BY updated_at DESC LIMIT ? OFFSET ?`).all(...params, limitNum, offset) as any[]

  res.json({ data: rows.map(mapReferral), total: countRow.total })
})

router.post('/', (req: Request, res: Response): void => {
  const auth = authGuard(req, res)
  if (!auth) { res.status(401).json({ message: '未登录' }); return }

  if (auth.role !== 'gp') {
    res.status(403).json({ message: `仅全科医生可创建转诊申请，当前角色为${roleLabel(auth.role)}` })
    return
  }

  const { patientName, patientAge, patientGender, reason, targetDept, urgency, expectedReturnDays, notes } = req.body
  if (!patientName || !reason || !targetDept) {
    res.status(400).json({ message: '患者姓名、转诊原因、拟转科室为必填' })
    return
  }

  const db = getDb()

  const insertReferral = db.prepare(`
    INSERT INTO referrals (patient_name, patient_age, patient_gender, reason, target_dept, urgency, expected_return_days, status, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'draft', ?)
  `)
  const result = insertReferral.run(patientName, patientAge || 0, patientGender || 'male', reason, targetDept, urgency || 'routine', expectedReturnDays || 7, auth.userId)

  const referralId = result.lastInsertRowid

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(auth.userId) as any
  db.prepare(`
    INSERT INTO referral_status_changes (referral_id, from_status, to_status, operator_id, operator_role, operator_name, note)
    VALUES (?, NULL, 'draft', ?, ?, ?, ?)
  `).run(referralId, auth.userId, user.role_label, user.display_name, notes || null)

  const row = db.prepare('SELECT * FROM referrals WHERE id = ?').get(referralId) as any
  res.status(201).json(mapReferral(row))
})

router.get('/:id', (req: Request, res: Response): void => {
  const auth = authGuard(req, res)
  if (!auth) { res.status(401).json({ message: '未登录' }); return }

  const db = getDb()
  const row = db.prepare('SELECT * FROM referrals WHERE id = ?').get(req.params.id) as any
  if (!row) { res.status(404).json({ message: '转诊记录不存在' }); return }
  res.json(mapReferral(row))
})

router.put('/:id', (req: Request, res: Response): void => {
  const auth = authGuard(req, res)
  if (!auth) { res.status(401).json({ message: '未登录' }); return }

  if (!EDIT_ALLOWED_ROLES.includes(auth.role)) {
    res.status(403).json({ message: `仅全科医生可修改转诊申请，当前角色为${roleLabel(auth.role)}` })
    return
  }

  const db = getDb()
  const referralId = Number(req.params.id)
  const row = db.prepare('SELECT * FROM referrals WHERE id = ?').get(referralId) as any
  if (!row) { res.status(404).json({ message: '转诊记录不存在' }); return }

  if (row.created_by !== auth.userId) {
    res.status(403).json({ message: '仅申请创建者可修改此转诊申请' })
    return
  }

  if (!EDIT_ALLOWED_STATUSES.includes(row.status)) {
    const statusLabel: Record<string, string> = {
      approved: '已审核', sent: '已发送', result_returned: '结果回传',
      change_alerted: '变更提醒', confirmed: '已确认', closed: '已闭环',
    }
    res.status(400).json({ message: `当前状态为"${statusLabel[row.status] || row.status}"，不可修改。仅草稿、被驳回、待审核、已发送、变更提醒状态可修改` })
    return
  }

  const { reason, targetDept, urgency, expectedReturnDays, changeNote } = req.body
  if (!changeNote || !changeNote.trim()) {
    res.status(400).json({ message: '变更说明不能为空，必须填写修改原因' })
    return
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(auth.userId) as any
  const insertSnapshot = db.prepare(`
    INSERT INTO referral_change_snapshots (referral_id, field, old_value, new_value, operator_id, operator_name, note)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)

  const updates: string[] = []
  const values: any[] = []
  const fields: { key: string; oldVal: string; newVal: string }[] = []

  if (reason !== undefined && reason !== row.reason) {
    fields.push({ key: 'reason', oldVal: row.reason, newVal: reason })
    updates.push('reason = ?')
    values.push(reason)
  }
  if (targetDept !== undefined && targetDept !== row.target_dept) {
    fields.push({ key: 'targetDept', oldVal: row.target_dept, newVal: targetDept })
    updates.push('target_dept = ?')
    values.push(targetDept)
  }
  if (urgency !== undefined && urgency !== row.urgency) {
    fields.push({ key: 'urgency', oldVal: row.urgency, newVal: urgency })
    updates.push('urgency = ?')
    values.push(urgency)
  }
  if (expectedReturnDays !== undefined && expectedReturnDays !== row.expected_return_days) {
    fields.push({ key: 'expectedReturnDays', oldVal: String(row.expected_return_days), newVal: String(expectedReturnDays) })
    updates.push('expected_return_days = ?')
    values.push(expectedReturnDays)
  }

  if (fields.length === 0) {
    res.json(mapReferral(row))
    return
  }

  const shouldTriggerChange = EDIT_TRIGGER_CHANGE_STATUSES.includes(row.status)

  updates.push('version = version + 1')
  updates.push("updated_at = datetime('now')")
  values.push(referralId)

  db.prepare(`UPDATE referrals SET ${updates.join(', ')} WHERE id = ?`).run(...values)

  for (const f of fields) {
    const label = FIELD_LABELS[f.key] || f.key
    insertSnapshot.run(referralId, label, f.oldVal, f.newVal, auth.userId, user.display_name, changeNote)
  }

  if (shouldTriggerChange) {
    db.prepare("UPDATE referrals SET status = 'change_alerted', updated_at = datetime('now') WHERE id = ?").run(referralId)

    db.prepare(`
      INSERT INTO referral_status_changes (referral_id, from_status, to_status, operator_id, operator_role, operator_name, note)
      VALUES (?, ?, 'change_alerted', ?, ?, ?, ?)
    `).run(referralId, row.status, auth.userId, user.role_label, user.display_name, `申请内容变更，自动标记变更提醒。${changeNote}`)

    db.prepare('UPDATE result_returns SET referral_modified_after_sent = 1 WHERE referral_id = ? AND confirmed_at IS NULL').run(referralId)
  }

  const updated = db.prepare('SELECT * FROM referrals WHERE id = ?').get(referralId) as any
  res.json(mapReferral(updated))
})

router.patch('/:id/status', (req: Request, res: Response): void => {
  const auth = authGuard(req, res)
  if (!auth) { res.status(401).json({ message: '未登录' }); return }

  const db = getDb()
  const referralId = Number(req.params.id)
  const { status, note } = req.body

  const targetStatus = status as Status
  const rule = TRANSITION_RULES[targetStatus]
  if (!rule) {
    const validList = Object.keys(TRANSITION_RULES).filter(s => TRANSITION_RULES[s as Status].allowedRoles.length > 0).join('、')
    res.status(400).json({ message: `无效的目标状态"${status}"，合法的手动流转目标为：${validList}` })
    return
  }

  if (rule.allowedRoles.length > 0 && !rule.allowedRoles.includes(auth.role)) {
    res.status(403).json({ message: `"${rule.label}"操作需要${rule.allowedRoles.map(roleLabel).join('或')}角色，当前角色为${roleLabel(auth.role)}` })
    return
  }

  const row = db.prepare('SELECT * FROM referrals WHERE id = ?').get(referralId) as any
  if (!row) { res.status(404).json({ message: '转诊记录不存在' }); return }

  if (!rule.fromStatuses.includes(row.status)) {
    const statusLabel: Record<string, string> = {
      draft: '草稿', pending_review: '待审核', approved: '已审核', rejected: '已驳回',
      sent: '已发送', result_returned: '结果回传', change_alerted: '变更提醒',
      confirmed: '已确认', closed: '已闭环',
    }
    const expected = rule.fromStatuses.map(s => `"${statusLabel[s]}"`).join('、')
    res.status(400).json({ message: `"${rule.label}"操作要求当前状态为${expected}，实际为"${statusLabel[row.status] || row.status}"` })
    return
  }

  if (targetStatus === 'pending_review' && row.created_by !== auth.userId) {
    res.status(403).json({ message: '仅申请创建者可提交审核' })
    return
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(auth.userId) as any

  db.prepare("UPDATE referrals SET status = ?, updated_at = datetime('now') WHERE id = ?").run(targetStatus, referralId)

  db.prepare(`
    INSERT INTO referral_status_changes (referral_id, from_status, to_status, operator_id, operator_role, operator_name, note)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(referralId, row.status, targetStatus, auth.userId, user.role_label, user.display_name, note || null)

  const updated = db.prepare('SELECT * FROM referrals WHERE id = ?').get(referralId) as any
  res.json(mapReferral(updated))
})

router.get('/:id/changes', (req: Request, res: Response): void => {
  const auth = authGuard(req, res)
  if (!auth) { res.status(401).json({ message: '未登录' }); return }

  const db = getDb()
  const rows = db.prepare('SELECT * FROM referral_status_changes WHERE referral_id = ? ORDER BY created_at ASC').all(req.params.id) as any[]
  res.json(rows.map(mapStatusChange))
})

router.get('/:id/snapshots', (req: Request, res: Response): void => {
  const auth = authGuard(req, res)
  if (!auth) { res.status(401).json({ message: '未登录' }); return }

  const db = getDb()
  const rows = db.prepare('SELECT * FROM referral_change_snapshots WHERE referral_id = ? ORDER BY created_at ASC').all(req.params.id) as any[]
  res.json(rows.map(mapSnapshot))
})

export default router
