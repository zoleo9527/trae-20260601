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

  const insertChange = db.prepare(`
    INSERT INTO referral_status_changes (referral_id, from_status, to_status, operator_id, operator_role, operator_name, note)
    VALUES (?, NULL, 'draft', ?, ?, ?, ?)
  `)
  const db2 = getDb()
  const user = db2.prepare('SELECT * FROM users WHERE id = ?').get(auth.userId) as any
  insertChange.run(referralId, auth.userId, user.role_label, user.display_name, notes || null)

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

  const db = getDb()
  const referralId = Number(req.params.id)
  const row = db.prepare('SELECT * FROM referrals WHERE id = ?').get(referralId) as any
  if (!row) { res.status(404).json({ message: '转诊记录不存在' }); return }

  const allowedStatuses = ['draft', 'rejected', 'pending_review', 'approved', 'sent']
  if (!allowedStatuses.includes(row.status)) {
    res.status(400).json({ message: '当前状态不允许修改' })
    return
  }

  const { reason, targetDept, urgency, expectedReturnDays, changeNote } = req.body
  if (!changeNote || !changeNote.trim()) {
    res.status(400).json({ message: '变更说明不能为空' })
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

  const wasSentOrLater = ['sent', 'result_returned', 'change_alerted', 'confirmed'].includes(row.status)

  updates.push('version = version + 1')
  updates.push("updated_at = datetime('now')")
  values.push(referralId)

  db.prepare(`UPDATE referrals SET ${updates.join(', ')} WHERE id = ?`).run(...values)

  for (const f of fields) {
    const label = FIELD_LABELS[f.key] || f.key
    insertSnapshot.run(referralId, label, f.oldVal, f.newVal, auth.userId, user.display_name, changeNote)
  }

  if (wasSentOrLater) {
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

  const validStatuses = ['pending_review', 'approved', 'rejected', 'sent', 'result_returned', 'confirmed', 'closed']
  if (!validStatuses.includes(status)) {
    res.status(400).json({ message: '无效的状态' })
    return
  }

  const row = db.prepare('SELECT * FROM referrals WHERE id = ?').get(referralId) as any
  if (!row) { res.status(404).json({ message: '转诊记录不存在' }); return }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(auth.userId) as any

  db.prepare("UPDATE referrals SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, referralId)

  db.prepare(`
    INSERT INTO referral_status_changes (referral_id, from_status, to_status, operator_id, operator_role, operator_name, note)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(referralId, row.status, status, auth.userId, user.role_label, user.display_name, note || null)

  if (status === 'sent') {
    db.prepare("UPDATE referrals SET version = 1 WHERE id = ? AND version = 1").run(referralId)
  }

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
