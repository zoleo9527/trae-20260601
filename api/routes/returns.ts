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

function mapReturn(row: any) {
  return {
    id: row.id,
    referralId: row.referral_id,
    resultContent: row.result_content,
    resultDept: row.result_dept,
    resultDoctor: row.result_doctor,
    referralModifiedAfterSent: Boolean(row.referral_modified_after_sent),
    changeAcknowledged: Boolean(row.change_acknowledged),
    confirmedBy: row.confirmed_by,
    confirmedByName: row.confirmed_by_name,
    confirmedAt: row.confirmed_at,
    createdAt: row.created_at,
  }
}

router.get('/', (req: Request, res: Response): void => {
  const auth = authGuard(req, res)
  if (!auth) { res.status(401).json({ message: '未登录' }); return }

  const db = getDb()
  const { referralId, page = '1', limit = '20' } = req.query
  const pageNum = Number(page)
  const limitNum = Number(limit)
  const offset = (pageNum - 1) * limitNum

  let whereClause = '1=1'
  const params: any[] = []

  if (referralId) {
    whereClause += ' AND referral_id = ?'
    params.push(referralId)
  }

  const countRow = db.prepare(`SELECT COUNT(*) as total FROM result_returns WHERE ${whereClause}`).get(...params) as { total: number }
  const rows = db.prepare(`SELECT * FROM result_returns WHERE ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(...params, limitNum, offset) as any[]

  res.json({ data: rows.map(mapReturn), total: countRow.total })
})

router.get('/:id', (req: Request, res: Response): void => {
  const auth = authGuard(req, res)
  if (!auth) { res.status(401).json({ message: '未登录' }); return }

  const db = getDb()
  const row = db.prepare('SELECT * FROM result_returns WHERE id = ?').get(req.params.id) as any
  if (!row) { res.status(404).json({ message: '回传记录不存在' }); return }
  res.json(mapReturn(row))
})

router.post('/', (req: Request, res: Response): void => {
  const auth = authGuard(req, res)
  if (!auth) { res.status(401).json({ message: '未登录' }); return }

  const { referralId, resultContent, resultDept, resultDoctor } = req.body
  if (!referralId || !resultContent || !resultDept || !resultDoctor) {
    res.status(400).json({ message: '转诊ID、回传内容、回传科室、回传医生为必填' })
    return
  }

  const db = getDb()
  const referral = db.prepare('SELECT * FROM referrals WHERE id = ?').get(referralId) as any
  if (!referral) { res.status(404).json({ message: '转诊记录不存在' }); return }

  const hasUnreadSnapshots = db.prepare(
    "SELECT COUNT(*) as count FROM referral_change_snapshots WHERE referral_id = ? AND created_at > ?"
  ).get(referralId, referral.updated_at) as { count: number }

  const referralModifiedAfterSent = referral.version > 1 || hasUnreadSnapshots.count > 0

  const result = db.prepare(`
    INSERT INTO result_returns (referral_id, result_content, result_dept, result_doctor, referral_modified_after_sent)
    VALUES (?, ?, ?, ?, ?)
  `).run(referralId, resultContent, resultDept, resultDoctor, referralModifiedAfterSent ? 1 : 0)

  if (referral.status === 'sent' || referral.status === 'change_alerted') {
    const newStatus = referralModifiedAfterSent ? 'change_alerted' : 'result_returned'
    db.prepare("UPDATE referrals SET status = ?, updated_at = datetime('now') WHERE id = ?").run(newStatus, referralId)

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(auth.userId) as any
    db.prepare(`
      INSERT INTO referral_status_changes (referral_id, from_status, to_status, operator_id, operator_role, operator_name, note)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(referralId, referral.status, newStatus, auth.userId, user.role_label, user.display_name, '上级医院回传结果')
  }

  const row = db.prepare('SELECT * FROM result_returns WHERE id = ?').get(result.lastInsertRowid) as any
  res.status(201).json(mapReturn(row))
})

router.patch('/:id/confirm', (req: Request, res: Response): void => {
  const auth = authGuard(req, res)
  if (!auth) { res.status(401).json({ message: '未登录' }); return }

  const db = getDb()
  const returnId = Number(req.params.id)
  const row = db.prepare('SELECT * FROM result_returns WHERE id = ?').get(returnId) as any
  if (!row) { res.status(404).json({ message: '回传记录不存在' }); return }
  if (row.confirmed_at) { res.status(400).json({ message: '已确认，不可重复操作' }); return }

  const { changeAcknowledged, note } = req.body

  if (row.referral_modified_after_sent && !changeAcknowledged) {
    res.status(400).json({ message: '申请已变更，请先确认已阅读变更内容' })
    return
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(auth.userId) as any

  db.prepare(`
    UPDATE result_returns
    SET change_acknowledged = ?, confirmed_by = ?, confirmed_by_name = ?, confirmed_at = datetime('now')
    WHERE id = ?
  `).run(
    changeAcknowledged ? 1 : (row.referral_modified_after_sent ? 1 : 0),
    auth.userId,
    user.display_name,
    returnId
  )

  const referral = db.prepare('SELECT * FROM referrals WHERE id = ?').get(row.referral_id) as any
  if (referral && (referral.status === 'result_returned' || referral.status === 'change_alerted')) {
    db.prepare("UPDATE referrals SET status = 'confirmed', updated_at = datetime('now') WHERE id = ?").run(row.referral_id)
    db.prepare(`
      INSERT INTO referral_status_changes (referral_id, from_status, to_status, operator_id, operator_role, operator_name, note)
      VALUES (?, ?, 'confirmed', ?, ?, ?, ?)
    `).run(row.referral_id, referral.status, auth.userId, user.role_label, user.display_name, note || '确认签收回传结果')
  }

  const updated = db.prepare('SELECT * FROM result_returns WHERE id = ?').get(returnId) as any
  res.json(mapReturn(updated))
})

export default router
