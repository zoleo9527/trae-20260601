import { Router, type Request, type Response } from 'express'
import { getDb } from '../db.js'
import { v4 as uuidv4 } from 'uuid'

const router = Router()

function addNotification(db: any, type: string, title: string, content: string, sourceType: string, sourceId: string) {
  db.prepare(`INSERT INTO notifications (id, type, title, content, source_type, source_id, is_read, created_at) VALUES (?, ?, ?, ?, ?, ?, 0, datetime('now', 'localtime'))`)
    .run(uuidv4(), type, title, content, sourceType, sourceId)
}

function addHistory(db: any, problemRecordId: string, action: string, operatorId: string, operatorName: string, operatorRole: string, description: string) {
  db.prepare(`INSERT INTO problem_history (id, problem_record_id, action, operator_id, operator_name, operator_role, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', 'localtime'))`)
    .run(uuidv4(), problemRecordId, action, operatorId, operatorName, operatorRole, description)
}

router.get('/', (_req: Request, res: Response): void => {
  const db = getDb()
  const { status, problemType, keyword } = _req.query as { status?: string; problemType?: string; keyword?: string }

  let sql = 'SELECT * FROM problem_records WHERE 1=1'
  const params: any[] = []

  if (status) {
    sql += ' AND status = ?'
    params.push(status)
  }
  if (problemType) {
    sql += ' AND problem_type = ?'
    params.push(problemType)
  }
  if (keyword) {
    sql += ' AND (tracking_number LIKE ? OR description LIKE ?)'
    params.push(`%${keyword}%`, `%${keyword}%`)
  }

  sql += ' ORDER BY created_at DESC'

  const rows = db.prepare(sql).all(...params)
  res.json({ success: true, data: rows })
})

router.get('/:id', (req: Request, res: Response): void => {
  const db = getDb()
  const problem = db.prepare('SELECT * FROM problem_records WHERE id = ?').get(req.params.id) as any
  if (!problem) {
    res.status(404).json({ success: false, error: 'Problem record not found' })
    return
  }

  const contacts = db.prepare('SELECT * FROM customer_contacts WHERE problem_record_id = ? ORDER BY created_at DESC').all(req.params.id)
  const history = db.prepare('SELECT * FROM problem_history WHERE problem_record_id = ? ORDER BY created_at ASC').all(req.params.id)
  const delivery = db.prepare('SELECT * FROM deliveries WHERE id = ?').get(problem.delivery_id)

  res.json({
    success: true,
    data: {
      ...problem,
      contacts,
      history,
      delivery: delivery || null,
    },
  })
})

router.post('/', (req: Request, res: Response): void => {
  const db = getDb()
  const id = uuidv4()
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19)

  const {
    deliveryId, trackingNumber, problemType, description = '',
    reporterId, reporterName, reporterRole,
    responsiblePersonId, responsiblePersonName,
  } = req.body

  const status = 'pending'

  const transaction = db.transaction(() => {
    db.prepare(`
      INSERT INTO problem_records (id, delivery_id, tracking_number, problem_type, description, reporter_id, reporter_name, reporter_role, responsible_person_id, responsible_person_name, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, deliveryId, trackingNumber, problemType, description, reporterId, reporterName, reporterRole, responsiblePersonId, responsiblePersonName, status, now, now)

    db.prepare('UPDATE deliveries SET status = ?, updated_at = ? WHERE id = ?').run('problem', now, deliveryId)

    addHistory(db, id, 'created', reporterId, reporterName, reporterRole, `登记问题件：${description}`)
    addNotification(db, 'problem_created', '问题件登记', `快件 ${trackingNumber} 登记为问题件（${problemType}）`, 'problem', id)
    addNotification(db, 'contact_required', '待联系客户', `问题件 ${trackingNumber} 需要联系客户`, 'problem', id)
  })

  try {
    transaction()
    const row = db.prepare('SELECT * FROM problem_records WHERE id = ?').get(id)
    res.json({ success: true, data: row })
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message })
  }
})

router.patch('/:id', (req: Request, res: Response): void => {
  const db = getDb()
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19)
  const existing = db.prepare('SELECT * FROM problem_records WHERE id = ?').get(req.params.id) as any
  if (!existing) {
    res.status(404).json({ success: false, error: 'Problem record not found' })
    return
  }

  const {
    problemType, description, responsiblePersonId, responsiblePersonName, status, resolution,
    operatorId, operatorName, operatorRole,
  } = req.body

  const fields: string[] = []
  const params: any[] = []

  if (problemType !== undefined) { fields.push('problem_type = ?'); params.push(problemType) }
  if (description !== undefined) { fields.push('description = ?'); params.push(description) }
  if (responsiblePersonId !== undefined) { fields.push('responsible_person_id = ?'); params.push(responsiblePersonId) }
  if (responsiblePersonName !== undefined) { fields.push('responsible_person_name = ?'); params.push(responsiblePersonName) }
  if (status !== undefined) { fields.push('status = ?'); params.push(status) }
  if (resolution !== undefined) { fields.push('resolution = ?'); params.push(resolution) }

  if (fields.length === 0) {
    res.json({ success: true, data: existing })
    return
  }

  fields.push('updated_at = ?')
  params.push(now)
  params.push(req.params.id)

  const transaction = db.transaction(() => {
    db.prepare(`UPDATE problem_records SET ${fields.join(', ')} WHERE id = ?`).run(...params)

    if (status && status !== existing.status && operatorId) {
      addHistory(db, req.params.id, 'status_change', operatorId, operatorName, operatorRole, `状态从 ${existing.status} 变更为 ${status}`)
      addNotification(db, 'problem_updated', '问题件变更', `问题件 ${existing.tracking_number} 状态变更为 ${status}`, 'problem', req.params.id)
    }

    if (status === 'returned') {
      db.prepare('UPDATE deliveries SET status = ?, updated_at = ? WHERE id = ?').run('returned', now, existing.delivery_id)
    }
    if (status === 'resolved' || status === 'closed') {
      db.prepare('UPDATE deliveries SET status = ?, updated_at = ? WHERE id = ?').run('delivered', now, existing.delivery_id)
    }
  })

  try {
    transaction()
    const row = db.prepare('SELECT * FROM problem_records WHERE id = ?').get(req.params.id)
    res.json({ success: true, data: row })
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message })
  }
})

router.post('/:id/return', (req: Request, res: Response): void => {
  const db = getDb()
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19)
  const existing = db.prepare('SELECT * FROM problem_records WHERE id = ?').get(req.params.id) as any
  if (!existing) {
    res.status(404).json({ success: false, error: 'Problem record not found' })
    return
  }

  const { operatorId, operatorName, operatorRole, resolution } = req.body

  const transaction = db.transaction(() => {
    db.prepare('UPDATE problem_records SET status = ?, resolution = ?, updated_at = ? WHERE id = ?')
      .run('returned', resolution || '退回发件方', now, req.params.id)

    db.prepare('UPDATE deliveries SET status = ?, updated_at = ? WHERE id = ?')
      .run('returned', now, existing.delivery_id)

    addHistory(db, req.params.id, 'returned', operatorId, operatorName, operatorRole, `确认退回：${resolution || '退回发件方'}`)
    addNotification(db, 'return_confirmed', '退回确认', `问题件 ${existing.tracking_number} 已确认退回`, 'problem', req.params.id)
  })

  try {
    transaction()
    const row = db.prepare('SELECT * FROM problem_records WHERE id = ?').get(req.params.id)
    res.json({ success: true, data: row })
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message })
  }
})

router.post('/:id/supplement', (req: Request, res: Response): void => {
  const db = getDb()
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19)
  const existing = db.prepare('SELECT * FROM problem_records WHERE id = ?').get(req.params.id) as any
  if (!existing) {
    res.status(404).json({ success: false, error: 'Problem record not found' })
    return
  }

  const { operatorId, operatorName, operatorRole, description, problemType } = req.body

  const fields: string[] = ['status = ?', 'updated_at = ?']
  const params: any[] = ['supplementing', now]

  if (description) { fields.push('description = ?'); params.push(description) }
  if (problemType) { fields.push('problem_type = ?'); params.push(problemType) }

  params.push(req.params.id)

  const transaction = db.transaction(() => {
    db.prepare(`UPDATE problem_records SET ${fields.join(', ')} WHERE id = ?`).run(...params)

    addHistory(db, req.params.id, 'supplement', operatorId, operatorName, operatorRole, `补录信息：${description || '补充问题件信息'}`)
    addNotification(db, 'problem_updated', '问题件补录', `问题件 ${existing.tracking_number} 补录了新信息`, 'problem', req.params.id)
  })

  try {
    transaction()
    const row = db.prepare('SELECT * FROM problem_records WHERE id = ?').get(req.params.id)
    res.json({ success: true, data: row })
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message })
  }
})

router.post('/:id/change-responsible', (req: Request, res: Response): void => {
  const db = getDb()
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19)
  const existing = db.prepare('SELECT * FROM problem_records WHERE id = ?').get(req.params.id) as any
  if (!existing) {
    res.status(404).json({ success: false, error: 'Problem record not found' })
    return
  }

  const { operatorId, operatorName, operatorRole, newResponsibleId, newResponsibleName, reason } = req.body

  if (!newResponsibleId || !newResponsibleName) {
    res.status(400).json({ success: false, error: 'newResponsibleId and newResponsibleName are required' })
    return
  }

  const transaction = db.transaction(() => {
    db.prepare('UPDATE problem_records SET responsible_person_id = ?, responsible_person_name = ?, updated_at = ? WHERE id = ?')
      .run(newResponsibleId, newResponsibleName, now, req.params.id)

    addHistory(db, req.params.id, 'responsible_change', operatorId, operatorName, operatorRole,
      `责任人从 ${existing.responsible_person_name} 变更为 ${newResponsibleName}，原因：${reason || '未说明'}`)

    addNotification(db, 'responsible_change', '责任人变更',
      `问题件 ${existing.tracking_number} 责任人从 ${existing.responsible_person_name} 变更为 ${newResponsibleName}`,
      'problem', req.params.id)

    addNotification(db, 'problem_updated', '问题件变更',
      `问题件 ${existing.tracking_number} 责任人已变更`,
      'problem', req.params.id)
  })

  try {
    transaction()
    const row = db.prepare('SELECT * FROM problem_records WHERE id = ?').get(req.params.id)
    res.json({ success: true, data: row })
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message })
  }
})

router.post('/:id/review', (req: Request, res: Response): void => {
  const db = getDb()
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19)
  const existing = db.prepare('SELECT * FROM problem_records WHERE id = ?').get(req.params.id) as any
  if (!existing) {
    res.status(404).json({ success: false, error: 'Problem record not found' })
    return
  }

  const { operatorId, operatorName, operatorRole, action: reviewAction, resolution } = req.body

  const transaction = db.transaction(() => {
    if (reviewAction === 'approve') {
      db.prepare('UPDATE problem_records SET status = ?, resolution = ?, updated_at = ? WHERE id = ?')
        .run('closed', resolution || '复核通过', now, req.params.id)
      db.prepare('UPDATE deliveries SET status = ?, updated_at = ? WHERE id = ?')
        .run('delivered', now, existing.delivery_id)
      addHistory(db, req.params.id, 'review_approved', operatorId, operatorName, operatorRole, `复核通过：${resolution || ''}`)
    } else if (reviewAction === 'reject') {
      db.prepare('UPDATE problem_records SET status = ?, resolution = ?, updated_at = ? WHERE id = ?')
        .run('pending', resolution || '复核退回，需重新处理', now, req.params.id)
      addHistory(db, req.params.id, 'review_rejected', operatorId, operatorName, operatorRole, `复核退回：${resolution || ''}`)
    } else {
      db.prepare('UPDATE problem_records SET status = ?, updated_at = ? WHERE id = ?')
        .run('reviewing', now, req.params.id)
      addHistory(db, req.params.id, 'submitted_review', operatorId, operatorName, operatorRole, '提交复核')
    }

    addNotification(db, 'review_required' , '复核结果', `问题件 ${existing.tracking_number} 复核${reviewAction === 'approve' ? '通过' : reviewAction === 'reject' ? '退回' : '提交'}`, 'problem', req.params.id)
  })

  try {
    transaction()
    const row = db.prepare('SELECT * FROM problem_records WHERE id = ?').get(req.params.id)
    res.json({ success: true, data: row })
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message })
  }
})

export default router
