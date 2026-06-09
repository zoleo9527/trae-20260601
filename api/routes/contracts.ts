import { Router, type Request, type Response } from 'express'
import db from '../db.js'

const router = Router()

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 10)
}

router.get('/', (req: Request, res: Response): void => {
  const { status, createdBy, search, page = '1', limit = '10' } = req.query
  const pageNum = Math.max(1, parseInt(page as string) || 1)
  const limitNum = Math.max(1, parseInt(limit as string) || 10)
  const offset = (pageNum - 1) * limitNum

  let where = 'WHERE 1=1'
  const params: unknown[] = []

  if (status) {
    where += ' AND status = ?'
    params.push(status)
  }
  if (createdBy) {
    where += ' AND created_by = ?'
    params.push(createdBy)
  }
  if (search) {
    where += ' AND (resident_name LIKE ? OR contract_no LIKE ?)'
    params.push(`%${search}%`, `%${search}%`)
  }

  const totalRow = db.prepare(`SELECT COUNT(*) as cnt FROM contracts ${where}`).get(...params) as { cnt: number }
  const total = totalRow.cnt

  const rows = db.prepare(
    `SELECT * FROM contracts ${where} ORDER BY updated_at DESC LIMIT ? OFFSET ?`
  ).all(...params, limitNum, offset)

  res.json({ data: rows, total, page: pageNum, limit: limitNum })
})

router.post('/', (req: Request, res: Response): void => {
  const id = genId()
  const now = new Date().toISOString()
  const contract_no = 'HT' + Date.now()
  const {
    resident_name, resident_id_card, resident_phone, contract_type,
    service_package, period_start, period_end, team_doctor, team_nurse, created_by
  } = req.body

  db.prepare(`
    INSERT INTO contracts (id, resident_name, resident_id_card, resident_phone, contract_no, contract_type,
      service_package, period_start, period_end, team_doctor, team_nurse, status, created_by, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?, ?)
  `).run(id, resident_name, resident_id_card, resident_phone, contract_no, contract_type,
    service_package, period_start, period_end, team_doctor, team_nurse, created_by, now, now)

  const contract = db.prepare('SELECT * FROM contracts WHERE id = ?').get(id)
  res.status(201).json(contract)
})

router.get('/:id', (req: Request, res: Response): void => {
  const contract = db.prepare('SELECT * FROM contracts WHERE id = ?').get(req.params.id)
  if (!contract) {
    res.status(404).json({ error: '签约记录未找到' })
    return
  }
  const notes = db.prepare('SELECT * FROM notes WHERE contract_id = ? ORDER BY created_at DESC').all(req.params.id)
  const change_logs = db.prepare('SELECT * FROM change_logs WHERE contract_id = ? ORDER BY created_at DESC').all(req.params.id)
  res.json({ ...contract as object, notes, change_logs })
})

router.patch('/:id', (req: Request, res: Response): void => {
  const contract = db.prepare('SELECT * FROM contracts WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined
  if (!contract) {
    res.status(404).json({ error: '签约记录未找到' })
    return
  }

  const now = new Date().toISOString()
  const allowedFields = ['resident_name', 'resident_id_card', 'resident_phone', 'contract_type',
    'service_package', 'period_start', 'period_end', 'team_doctor', 'team_nurse', 'status']
  const updates: string[] = []
  const values: unknown[] = []

  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      updates.push(`${field} = ?`)
      values.push(req.body[field])
    }
  }

  if (updates.length === 0) {
    res.status(400).json({ error: '没有可更新的字段' })
    return
  }

  updates.push('updated_at = ?')
  values.push(now)
  values.push(req.params.id)

  db.prepare(`UPDATE contracts SET ${updates.join(', ')} WHERE id = ?`).run(...values)

  if (contract.status === 'in_archive') {
    const changedBy = req.body.changed_by || req.body.created_by || 'system'
    const changedByRole = req.body.changed_by_role || 'doctor'
    for (const field of allowedFields) {
      if (req.body[field] !== undefined && req.body[field] !== contract[field]) {
        const logId = genId()
        db.prepare(`
          INSERT INTO change_logs (id, contract_id, field, old_value, new_value, changed_by, changed_by_role, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(logId, req.params.id, field, String(contract[field] ?? ''), String(req.body[field]), changedBy, changedByRole, now)

        const notifId = genId()
        db.prepare(`
          INSERT INTO notifications (id, contract_id, archive_id, type, title, summary, is_read, target_role, created_at)
          VALUES (?, ?, NULL, 'contract_changed', ?, ?, 0, 'public_health', ?)
        `).run(notifId, req.params.id, '签约信息变更通知',
          `${contract.resident_name}的签约${field}已变更`, now)
      }
    }
  }

  const updated = db.prepare('SELECT * FROM contracts WHERE id = ?').get(req.params.id)
  res.json(updated)
})

router.post('/:id/notes', (req: Request, res: Response): void => {
  const contract = db.prepare('SELECT * FROM contracts WHERE id = ?').get(req.params.id)
  if (!contract) {
    res.status(404).json({ error: '签约记录未找到' })
    return
  }

  const id = genId()
  const now = new Date().toISOString()
  const { content, createdBy, createdByRole } = req.body
  const source = req.body.source || 'contract'

  db.prepare(`
    INSERT INTO notes (id, contract_id, archive_id, content, source, created_by, created_by_role, created_at)
    VALUES (?, ?, NULL, ?, ?, ?, ?, ?)
  `).run(id, req.params.id, content, source, createdBy, createdByRole, now)

  const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(id)
  res.status(201).json(note)
})

router.get('/:id/changes', (req: Request, res: Response): void => {
  const changes = db.prepare(
    'SELECT * FROM change_logs WHERE contract_id = ? ORDER BY created_at DESC'
  ).all(req.params.id)
  res.json(changes)
})

export default router
