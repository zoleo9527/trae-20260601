import { Router, type Request, type Response } from 'express'
import db from '../db.js'

const router = Router()

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 10)
}

router.get('/', (req: Request, res: Response): void => {
  const { status, search, page = '1', limit = '10' } = req.query
  const pageNum = Math.max(1, parseInt(page as string) || 1)
  const limitNum = Math.max(1, parseInt(limit as string) || 10)
  const offset = (pageNum - 1) * limitNum

  let where = 'WHERE 1=1'
  const params: unknown[] = []

  if (status) {
    where += ' AND a.status = ?'
    params.push(status)
  }
  if (search) {
    where += ' AND (c.resident_name LIKE ? OR c.contract_no LIKE ? OR a.archive_no LIKE ?)'
    params.push(`%${search}%`, `%${search}%`, `%${search}%`)
  }

  const totalRow = db.prepare(
    `SELECT COUNT(*) as cnt FROM archives a JOIN contracts c ON a.contract_id = c.id ${where}`
  ).get(...params) as { cnt: number }
  const total = totalRow.cnt

  const rows = db.prepare(
    `SELECT a.*, c.resident_name, c.contract_no FROM archives a JOIN contracts c ON a.contract_id = c.id ${where} ORDER BY a.updated_at DESC LIMIT ? OFFSET ?`
  ).all(...params, limitNum, offset)

  res.json({ data: rows, total, page: pageNum, limit: limitNum })
})

router.post('/', (req: Request, res: Response): void => {
  const { contractId } = req.body
  if (!contractId) {
    res.status(400).json({ error: 'contractId为必填项' })
    return
  }

  const contract = db.prepare('SELECT * FROM contracts WHERE id = ?').get(contractId) as Record<string, unknown> | undefined
  if (!contract) {
    res.status(404).json({ error: '签约记录未找到' })
    return
  }

  const existingArchive = db.prepare('SELECT * FROM archives WHERE contract_id = ?').get(contractId)
  if (existingArchive) {
    res.status(409).json({ error: '该签约已有档案记录' })
    return
  }

  const id = genId()
  const now = new Date().toISOString()
  const archive_no = 'DA' + Date.now()

  db.prepare(`
    INSERT INTO archives (id, contract_id, archive_no, status, processed_by, return_reason, completed_at, created_at, updated_at)
    VALUES (?, ?, ?, 'pending', NULL, NULL, NULL, ?, ?)
  `).run(id, contractId, archive_no, now, now)

  db.prepare('UPDATE contracts SET status = ?, updated_at = ? WHERE id = ?').run('in_archive', now, contractId)

  const archive = db.prepare('SELECT a.*, c.resident_name, c.contract_no FROM archives a JOIN contracts c ON a.contract_id = c.id WHERE a.id = ?').get(id)
  res.status(201).json(archive)
})

router.get('/:id', (req: Request, res: Response): void => {
  const archive = db.prepare('SELECT a.*, c.resident_name, c.contract_no, c.contract_type, c.service_package, c.period_start, c.period_end, c.team_doctor, c.team_nurse, c.status as contract_status FROM archives a JOIN contracts c ON a.contract_id = c.id WHERE a.id = ?').get(req.params.id)
  if (!archive) {
    res.status(404).json({ error: '档案未找到' })
    return
  }

  const archiveRecord = archive as Record<string, unknown>
  const contractId = archiveRecord.contract_id as string

  const notes = db.prepare(
    'SELECT * FROM notes WHERE contract_id = ? ORDER BY created_at DESC'
  ).all(contractId)

  const change_logs = db.prepare(
    'SELECT * FROM change_logs WHERE contract_id = ? ORDER BY created_at DESC'
  ).all(contractId)

  const notifications = db.prepare(
    "SELECT * FROM notifications WHERE contract_id = ? AND is_read = 0 ORDER BY created_at DESC"
  ).all(contractId)

  res.json({ ...archiveRecord, notes, change_logs, notifications })
})

router.patch('/:id', (req: Request, res: Response): void => {
  const archive = db.prepare('SELECT * FROM archives WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined
  if (!archive) {
    res.status(404).json({ error: '档案未找到' })
    return
  }

  const now = new Date().toISOString()
  const updates: string[] = []
  const values: unknown[] = []

  if (req.body.status !== undefined) {
    updates.push('status = ?')
    values.push(req.body.status)

    if (req.body.status === 'processing' && req.body.processedBy) {
      updates.push('processed_by = ?')
      values.push(req.body.processedBy)
    }
    if (req.body.status === 'completed') {
      updates.push('completed_at = ?')
      values.push(now)
    }
  }

  if (req.body.return_reason !== undefined) {
    updates.push('return_reason = ?')
    values.push(req.body.return_reason)
  }

  if (updates.length === 0) {
    res.status(400).json({ error: '没有可更新的字段' })
    return
  }

  updates.push('updated_at = ?')
  values.push(now)
  values.push(req.params.id)

  db.prepare(`UPDATE archives SET ${updates.join(', ')} WHERE id = ?`).run(...values)

  const updated = db.prepare('SELECT a.*, c.resident_name, c.contract_no FROM archives a JOIN contracts c ON a.contract_id = c.id WHERE a.id = ?').get(req.params.id)
  res.json(updated)
})

router.post('/:id/return', (req: Request, res: Response): void => {
  const archive = db.prepare('SELECT * FROM archives WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined
  if (!archive) {
    res.status(404).json({ error: '档案未找到' })
    return
  }

  const { reason, returnedBy, returnedByRole } = req.body
  if (!reason) {
    res.status(400).json({ error: '退回原因为必填项' })
    return
  }

  const now = new Date().toISOString()
  const contractId = archive.contract_id as string

  db.prepare(`
    INSERT INTO notes (id, contract_id, archive_id, content, source, created_by, created_by_role, created_at)
    VALUES (?, ?, ?, ?, 'return', ?, ?, ?)
  `).run(genId(), contractId, req.params.id, reason, returnedBy, returnedByRole, now)

  db.prepare('UPDATE contracts SET status = ?, updated_at = ? WHERE id = ?').run('returned', now, contractId)

  db.prepare(`
    INSERT INTO notifications (id, contract_id, archive_id, type, title, summary, is_read, target_role, created_at)
    VALUES (?, ?, ?, 'archive_return', '档案退回通知', ?, 0, 'doctor', ?)
  `).run(genId(), contractId, req.params.id, `档案已退回，原因：${reason}`, now)

  db.prepare('UPDATE archives SET status = ?, return_reason = ?, updated_at = ? WHERE id = ?').run('returned', reason, now, req.params.id)

  const updated = db.prepare('SELECT a.*, c.resident_name, c.contract_no FROM archives a JOIN contracts c ON a.contract_id = c.id WHERE a.id = ?').get(req.params.id)
  res.json(updated)
})

export default router
