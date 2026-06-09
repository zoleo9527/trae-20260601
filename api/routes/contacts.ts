import { Router, type Request, type Response } from 'express'
import { getDb } from '../db.js'
import { v4 as uuidv4 } from 'uuid'

const router = Router()

function addHistory(db: any, problemRecordId: string, action: string, operatorId: string, operatorName: string, operatorRole: string, description: string) {
  db.prepare(`INSERT INTO problem_history (id, problem_record_id, action, operator_id, operator_name, operator_role, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', 'localtime'))`)
    .run(uuidv4(), problemRecordId, action, operatorId, operatorName, operatorRole, description)
}

function addNotification(db: any, type: string, title: string, content: string, sourceType: string, sourceId: string) {
  db.prepare(`INSERT INTO notifications (id, type, title, content, source_type, source_id, is_read, created_at) VALUES (?, ?, ?, ?, ?, ?, 0, datetime('now', 'localtime'))`)
    .run(uuidv4(), type, title, content, sourceType, sourceId)
}

router.get('/', (_req: Request, res: Response): void => {
  const db = getDb()
  const { problemRecordId, trackingNumber } = _req.query as { problemRecordId?: string; trackingNumber?: string }

  let sql = 'SELECT * FROM customer_contacts WHERE 1=1'
  const params: any[] = []

  if (problemRecordId) {
    sql += ' AND problem_record_id = ?'
    params.push(problemRecordId)
  }
  if (trackingNumber) {
    sql += ' AND tracking_number LIKE ?'
    params.push(`%${trackingNumber}%`)
  }

  sql += ' ORDER BY created_at DESC'

  const rows = db.prepare(sql).all(...params)
  res.json({ success: true, data: rows })
})

router.get('/:id', (req: Request, res: Response): void => {
  const db = getDb()
  const row = db.prepare('SELECT * FROM customer_contacts WHERE id = ?').get(req.params.id)
  if (!row) {
    res.status(404).json({ success: false, error: 'Contact not found' })
    return
  }
  res.json({ success: true, data: row })
})

router.post('/', (req: Request, res: Response): void => {
  const db = getDb()
  const id = uuidv4()
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19)

  const {
    problemRecordId, trackingNumber, contactType,
    contactPersonId, contactPersonName, contactPersonRole,
    customerResponse = '', followUpRequired = false, notes = '',
  } = req.body

  const problem = db.prepare('SELECT * FROM problem_records WHERE id = ?').get(problemRecordId) as any
  if (!problem) {
    res.status(404).json({ success: false, error: 'Problem record not found' })
    return
  }

  const transaction = db.transaction(() => {
    db.prepare(`
      INSERT INTO customer_contacts (id, problem_record_id, tracking_number, contact_type, contact_person_id, contact_person_name, contact_person_role, customer_response, follow_up_required, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, problemRecordId, trackingNumber, contactType, contactPersonId, contactPersonName, contactPersonRole, customerResponse, followUpRequired ? 1 : 0, notes, now, now)

    if (problem.status === 'pending' || problem.status === 'supplementing') {
      db.prepare('UPDATE problem_records SET status = ?, updated_at = ? WHERE id = ?').run('contacting', now, problemRecordId)
      addHistory(db, problemRecordId, 'status_change', contactPersonId, contactPersonName, contactPersonRole, `状态从 ${problem.status} 变更为 contacting（客户联系中）`)
    }

    addHistory(db, problemRecordId, 'contact_added', contactPersonId, contactPersonName, contactPersonRole, `添加客户联系记录（${contactType}）：${customerResponse}`)

    if (followUpRequired) {
      addNotification(db, 'contact_required', '待跟进联系', `问题件 ${trackingNumber} 需要后续跟进`, 'problem', problemRecordId)
    }

    addNotification(db, 'problem_updated', '客户联系更新', `问题件 ${trackingNumber} 添加了客户联系记录`, 'problem', problemRecordId)
  })

  try {
    transaction()
    const row = db.prepare('SELECT * FROM customer_contacts WHERE id = ?').get(id)
    res.json({ success: true, data: row })
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message })
  }
})

router.patch('/:id', (req: Request, res: Response): void => {
  const db = getDb()
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19)
  const existing = db.prepare('SELECT * FROM customer_contacts WHERE id = ?').get(req.params.id) as any
  if (!existing) {
    res.status(404).json({ success: false, error: 'Contact not found' })
    return
  }

  const { customerResponse, followUpRequired, notes, contactType, operatorId, operatorName, operatorRole } = req.body

  const fields: string[] = []
  const params: any[] = []

  if (customerResponse !== undefined) { fields.push('customer_response = ?'); params.push(customerResponse) }
  if (followUpRequired !== undefined) { fields.push('follow_up_required = ?'); params.push(followUpRequired ? 1 : 0) }
  if (notes !== undefined) { fields.push('notes = ?'); params.push(notes) }
  if (contactType !== undefined) { fields.push('contact_type = ?'); params.push(contactType) }

  if (fields.length === 0) {
    res.json({ success: true, data: existing })
    return
  }

  fields.push('updated_at = ?')
  params.push(now)
  params.push(req.params.id)

  const transaction = db.transaction(() => {
    db.prepare(`UPDATE customer_contacts SET ${fields.join(', ')} WHERE id = ?`).run(...params)

    if (operatorId) {
      addHistory(db, existing.problem_record_id, 'contact_updated', operatorId, operatorName || '', operatorRole || '', '更新客户联系记录')
    }
  })

  try {
    transaction()
    const row = db.prepare('SELECT * FROM customer_contacts WHERE id = ?').get(req.params.id)
    res.json({ success: true, data: row })
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message })
  }
})

export default router
