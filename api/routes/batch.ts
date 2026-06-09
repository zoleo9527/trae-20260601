import { Router, type Request, type Response } from 'express'
import db from '../db.js'

const router = Router()

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 10)
}

router.post('/contracts', (req: Request, res: Response): void => {
  const { contracts, createdBy } = req.body
  if (!Array.isArray(contracts) || contracts.length === 0) {
    res.status(400).json({ error: 'contracts数组不能为空' })
    return
  }
  if (!createdBy) {
    res.status(400).json({ error: 'createdBy为必填项' })
    return
  }

  const now = new Date().toISOString()
  const created: unknown[] = []

  const insertOne = db.transaction(() => {
    for (const c of contracts) {
      const id = genId()
      const contract_no = 'HT' + Date.now() + Math.random().toString(36).substring(2, 6)
      db.prepare(`
        INSERT INTO contracts (id, resident_name, resident_id_card, resident_phone, contract_no, contract_type,
          service_package, period_start, period_end, team_doctor, team_nurse, status, created_by, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?, ?)
      `).run(id, c.resident_name, c.resident_id_card, c.resident_phone, contract_no, c.contract_type,
        c.service_package, c.period_start, c.period_end, c.team_doctor, c.team_nurse, createdBy, now, now)
      const row = db.prepare('SELECT * FROM contracts WHERE id = ?').get(id)
      created.push(row)
    }
  })

  insertOne()
  res.status(201).json({ count: created.length, data: created })
})

router.post('/supplement', (req: Request, res: Response): void => {
  const { contractIds, note, createdBy, createdByRole } = req.body
  if (!Array.isArray(contractIds) || contractIds.length === 0) {
    res.status(400).json({ error: 'contractIds数组不能为空' })
    return
  }
  if (!note || !createdBy || !createdByRole) {
    res.status(400).json({ error: 'note、createdBy、createdByRole为必填项' })
    return
  }

  const now = new Date().toISOString()
  const created: unknown[] = []

  const supplementAll = db.transaction(() => {
    for (const contractId of contractIds) {
      const contract = db.prepare('SELECT * FROM contracts WHERE id = ?').get(contractId)
      if (!contract) continue

      const id = genId()
      db.prepare(`
        INSERT INTO notes (id, contract_id, archive_id, content, source, created_by, created_by_role, created_at)
        VALUES (?, ?, NULL, ?, 'contract', ?, ?, ?)
      `).run(id, contractId, note, createdBy, createdByRole, now)

      const n = db.prepare('SELECT * FROM notes WHERE id = ?').get(id)
      created.push(n)
    }
  })

  supplementAll()
  res.status(201).json({ count: created.length, data: created })
})

export default router
