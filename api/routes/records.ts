import { Router, type Request, type Response } from 'express'
import { getDb, resetData } from '../db.js'
import { randomUUID } from 'crypto'

const router = Router()

function rowToRecord(row: Record<string, unknown>) {
  return {
    id: row.id,
    plateNumber: row.plate_number,
    ownerName: row.owner_name,
    vehicleType: row.vehicle_type,
    appointmentTime: row.appointment_time,
    status: row.status,
    receptionistId: row.receptionist_id,
    receptionTime: row.reception_time,
    receptionNotes: row.reception_notes,
    inspectorId: row.inspector_id,
    inspectionTime: row.inspection_time,
    inspectionResult: row.inspection_result,
    reviewerId: row.reviewer_id,
    reviewTime: row.review_time,
    reviewResult: row.review_result,
    returnReason: row.return_reason,
    supplementaryNotes: row.supplementary_notes,
    retryCount: row.retry_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function rowToLog(row: Record<string, unknown>) {
  return {
    id: row.id,
    recordId: row.record_id,
    action: row.action,
    operatorRole: row.operator_role,
    operatorId: row.operator_id,
    timestamp: row.timestamp,
    notes: row.notes,
  }
}

function addLog(db: ReturnType<typeof getDb>, recordId: string, action: string, role: string, operatorId: string, notes: string) {
  db.prepare(`
    INSERT INTO action_logs (id, record_id, action, operator_role, operator_id, timestamp, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(randomUUID(), recordId, action, role, operatorId, new Date().toISOString(), notes)
}

function badRequest(res: Response, message: string) {
  res.status(400).json({ error: message })
}

router.get('/records', (req: Request, res: Response) => {
  const db = getDb()
  const { role, status } = req.query

  let sql = 'SELECT * FROM appointment_records WHERE 1=1'
  const params: string[] = []

  if (status) {
    sql += ' AND status = ?'
    params.push(status as string)
  } else if (role === 'receptionist') {
    sql += ' AND status IN (?, ?)'
    params.push('pending_reception', 'returned')
  } else if (role === 'inspector') {
    sql += ' AND status = ?'
    params.push('pending_inspection')
  } else if (role === 'reviewer') {
    sql += ' AND status = ?'
    params.push('pending_review')
  }

  sql += ' ORDER BY appointment_time ASC'

  const rows = db.prepare(sql).all(...params) as Record<string, unknown>[]
  res.json(rows.map(rowToRecord))
})

router.get('/records/:id', (req: Request, res: Response) => {
  const db = getDb()
  const row = db.prepare('SELECT * FROM appointment_records WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined
  if (!row) {
    res.status(404).json({ error: 'Record not found' })
    return
  }
  res.json(rowToRecord(row))
})

router.get('/records/:id/logs', (req: Request, res: Response) => {
  const db = getDb()
  const rows = db.prepare('SELECT * FROM action_logs WHERE record_id = ? ORDER BY timestamp ASC').all(req.params.id) as Record<string, unknown>[]
  res.json(rows.map(rowToLog))
})

router.post('/records/:id/receive', (req: Request, res: Response) => {
  const db = getDb()
  const { receptionNotes, operatorId } = req.body
  const now = new Date().toISOString()

  if (!receptionNotes || !String(receptionNotes).trim()) {
    return badRequest(res, '接车备注不能为空，请填写接车时的情况说明')
  }

  const record = db.prepare('SELECT * FROM appointment_records WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined
  if (!record) {
    res.status(404).json({ error: '记录不存在' })
    return
  }

  if (record.status !== 'pending_reception' && record.status !== 'returned') {
    return badRequest(res, '当前状态不允许接车')
  }

  db.prepare(`
    UPDATE appointment_records
    SET status = 'pending_inspection',
        receptionist_id = ?,
        reception_time = ?,
        reception_notes = ?,
        updated_at = ?
    WHERE id = ?
  `).run(operatorId || 'receptionist-1', now, String(receptionNotes).trim(), now, req.params.id)

  addLog(db, req.params.id, 'received', 'receptionist', operatorId || 'receptionist-1', String(receptionNotes).trim())

  const updated = db.prepare('SELECT * FROM appointment_records WHERE id = ?').get(req.params.id) as Record<string, unknown>
  res.json(rowToRecord(updated))
})

router.post('/records/:id/inspect', (req: Request, res: Response) => {
  const db = getDb()
  const { inspectionResult, operatorId } = req.body
  const now = new Date().toISOString()

  if (!inspectionResult || !String(inspectionResult).trim()) {
    return badRequest(res, '检测结果不能为空，请填写车辆检测结果')
  }

  const record = db.prepare('SELECT * FROM appointment_records WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined
  if (!record) {
    res.status(404).json({ error: '记录不存在' })
    return
  }

  if (record.status !== 'pending_inspection') {
    return badRequest(res, '当前状态不允许检测')
  }

  const retryCount = (record.retry_count as number) || 0
  const action = retryCount > 0 ? 'reinspected' : 'inspected'

  db.prepare(`
    UPDATE appointment_records
    SET status = 'pending_review',
        inspector_id = ?,
        inspection_time = ?,
        inspection_result = ?,
        updated_at = ?
    WHERE id = ?
  `).run(operatorId || 'inspector-1', now, String(inspectionResult).trim(), now, req.params.id)

  addLog(db, req.params.id, action, 'inspector', operatorId || 'inspector-1', String(inspectionResult).trim())

  const updated = db.prepare('SELECT * FROM appointment_records WHERE id = ?').get(req.params.id) as Record<string, unknown>
  res.json(rowToRecord(updated))
})

router.post('/records/:id/review', (req: Request, res: Response) => {
  const db = getDb()
  const { reviewResult, returnReason, operatorId } = req.body
  const now = new Date().toISOString()

  if (!['pass', 'return', 'reject'].includes(reviewResult)) {
    return badRequest(res, '无效的审核结果')
  }

  if ((reviewResult === 'return' || reviewResult === 'reject') && (!returnReason || !String(returnReason).trim())) {
    return badRequest(res, reviewResult === 'return' ? '退回原因不能为空，请说明退回原因' : '终止原因不能为空，请说明终止原因')
  }

  const record = db.prepare('SELECT * FROM appointment_records WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined
  if (!record) {
    res.status(404).json({ error: '记录不存在' })
    return
  }

  if (record.status !== 'pending_review') {
    return badRequest(res, '当前状态不允许审核')
  }

  const retryCount = (record.retry_count as number) || 0
  let newStatus: string
  let action: string

  if (reviewResult === 'pass') {
    newStatus = 'completed'
    action = retryCount > 0 ? 'reapproved' : 'approved'
  } else if (reviewResult === 'return') {
    newStatus = 'returned'
    action = 'returned'
  } else {
    newStatus = 'rejected'
    action = 'rejected'
  }

  const reason = (returnReason || '').trim()

  db.prepare(`
    UPDATE appointment_records
    SET status = ?,
        reviewer_id = ?,
        review_time = ?,
        review_result = ?,
        return_reason = ?,
        retry_count = ?,
        updated_at = ?
    WHERE id = ?
  `).run(
    newStatus,
    operatorId || 'reviewer-1',
    now,
    reviewResult,
    reason,
    reviewResult === 'return' ? retryCount + 1 : retryCount,
    now,
    req.params.id,
  )

  addLog(db, req.params.id, action, 'reviewer', operatorId || 'reviewer-1', reason)

  const updated = db.prepare('SELECT * FROM appointment_records WHERE id = ?').get(req.params.id) as Record<string, unknown>
  res.json(rowToRecord(updated))
})

router.post('/records/:id/supplement', (req: Request, res: Response) => {
  const db = getDb()
  const { supplementaryNotes, operatorId } = req.body
  const now = new Date().toISOString()

  if (!supplementaryNotes || !String(supplementaryNotes).trim()) {
    return badRequest(res, '补充备注不能为空，请针对退回原因补充说明')
  }

  const record = db.prepare('SELECT * FROM appointment_records WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined
  if (!record) {
    res.status(404).json({ error: '记录不存在' })
    return
  }

  if (record.status !== 'returned') {
    return badRequest(res, '只有退回状态的记录可以补充备注')
  }

  const notes = String(supplementaryNotes).trim()

  db.prepare(`
    UPDATE appointment_records
    SET status = 'pending_inspection',
        supplementary_notes = ?,
        updated_at = ?
    WHERE id = ?
  `).run(notes, now, req.params.id)

  addLog(db, req.params.id, 'supplemented', 'receptionist', operatorId || 'receptionist-1', notes)

  const updated = db.prepare('SELECT * FROM appointment_records WHERE id = ?').get(req.params.id) as Record<string, unknown>
  res.json(rowToRecord(updated))
})

router.post('/records/batch-review', (req: Request, res: Response) => {
  const db = getDb()
  const { ids, reviewResult, returnReason, operatorId } = req.body
  const now = new Date().toISOString()

  if (!Array.isArray(ids) || ids.length === 0) {
    return badRequest(res, '请选择要处理的记录')
  }

  if (!['pass', 'return', 'reject'].includes(reviewResult)) {
    return badRequest(res, '无效的审核结果')
  }

  if ((reviewResult === 'return' || reviewResult === 'reject') && (!returnReason || !String(returnReason).trim())) {
    return badRequest(res, reviewResult === 'return' ? '批量退回原因不能为空，请说明退回原因' : '批量终止原因不能为空，请说明终止原因')
  }

  let updated = 0
  const reason = (returnReason || '').trim()
  const transaction = db.transaction(() => {
    for (const id of ids) {
      const record = db.prepare('SELECT * FROM appointment_records WHERE id = ?').get(id) as Record<string, unknown> | undefined
      if (!record || record.status !== 'pending_review') continue

      const retryCount = (record.retry_count as number) || 0
      let newStatus: string
      let action: string

      if (reviewResult === 'pass') {
        newStatus = 'completed'
        action = retryCount > 0 ? 'reapproved' : 'approved'
      } else if (reviewResult === 'return') {
        newStatus = 'returned'
        action = 'returned'
      } else if (reviewResult === 'reject') {
        newStatus = 'rejected'
        action = 'rejected'
      } else {
        continue
      }

      db.prepare(`
        UPDATE appointment_records
        SET status = ?,
            reviewer_id = ?,
            review_time = ?,
            review_result = ?,
            return_reason = ?,
            retry_count = ?,
            updated_at = ?
        WHERE id = ?
      `).run(
        newStatus,
        operatorId || 'reviewer-1',
        now,
        reviewResult,
        reason,
        reviewResult === 'return' ? retryCount + 1 : retryCount,
        now,
        id,
      )

      addLog(db, id, action, 'reviewer', operatorId || 'reviewer-1', reason)
      updated++
    }
  })
  transaction()

  res.json({ updated })
})

router.post('/records/reset', (_req: Request, res: Response) => {
  resetData()
  res.json({ reset: true })
})

router.post('/records/demo/normal', (_req: Request, res: Response) => {
  const db = getDb()
  const now = new Date().toISOString()

  const id = 'DEMO-NORMAL-001'
  const plateNumber = '演示·A12345'

  db.transaction(() => {
    db.prepare('DELETE FROM appointment_records WHERE id = ?').run(id)
    db.prepare('DELETE FROM action_logs WHERE record_id = ?').run(id)

    db.prepare(`
      INSERT INTO appointment_records (
        id, plate_number, owner_name, vehicle_type, appointment_time,
        status, receptionist_id, reception_time, reception_notes,
        inspector_id, inspection_time, inspection_result,
        reviewer_id, review_time, review_result,
        return_reason, supplementary_notes, retry_count,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, plateNumber, '演示用户-正常流程', '小型轿车', '2026-06-14 09:00',
      'pending_reception',
      null, null, '',
      null, null, '',
      null, null, null,
      '', '', 0,
      now, now
    )

    addLog(db, id, 'created', 'system', 'system', '演示数据创建')
  })()

  res.json({ id, plateNumber, message: '正常流程演示数据已创建，请从接车员开始处理' })
})

router.post('/records/demo/exception', (_req: Request, res: Response) => {
  const db = getDb()
  const now = new Date().toISOString()

  const id = 'DEMO-EXCEPTION-001'
  const plateNumber = '演示·B67890'

  db.transaction(() => {
    db.prepare('DELETE FROM appointment_records WHERE id = ?').run(id)
    db.prepare('DELETE FROM action_logs WHERE record_id = ?').run(id)

    db.prepare(`
      INSERT INTO appointment_records (
        id, plate_number, owner_name, vehicle_type, appointment_time,
        status, receptionist_id, reception_time, reception_notes,
        inspector_id, inspection_time, inspection_result,
        reviewer_id, review_time, review_result,
        return_reason, supplementary_notes, retry_count,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, plateNumber, '演示用户-异常流程', 'SUV', '2026-06-14 10:00',
      'pending_reception',
      null, null, '',
      null, null, '',
      null, null, null,
      '', '', 0,
      now, now
    )

    addLog(db, id, 'created', 'system', 'system', '演示数据创建')
  })()

  res.json({ id, plateNumber, message: '异常流程演示数据已创建，请从接车员开始处理，后续在审核环节选择退回或终止' })
})

router.get('/records/demo/status', (_req: Request, res: Response) => {
  const db = getDb()
  const rows = db.prepare("SELECT * FROM appointment_records WHERE id LIKE 'DEMO-%' ORDER BY id ASC").all() as Record<string, unknown>[]
  res.json(rows.map(rowToRecord))
})

export default router
