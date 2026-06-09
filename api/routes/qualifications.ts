import { Router, type Request, type Response } from 'express'
import { v4 as uuid } from 'uuid'
import db from '../db.js'
import { getSession } from './session.js'
import type { Qualification, QualificationReviewLog, QualificationStatus } from '../types.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  const { status, customer_name, submitted_by, expire_before, expire_after, page = '1', page_size = '20' } = req.query as {
    status?: string
    customer_name?: string
    submitted_by?: string
    expire_before?: string
    expire_after?: string
    page?: string
    page_size?: string
  }

  const conditions: string[] = []
  const params: Record<string, string> = {}

  if (status) {
    conditions.push('status = @status')
    params.status = status
  }
  if (customer_name) {
    conditions.push('customer_name LIKE @customer_name')
    params.customer_name = `%${customer_name}%`
  }
  if (submitted_by) {
    conditions.push('submitted_by LIKE @submitted_by')
    params.submitted_by = `%${submitted_by}%`
  }
  if (expire_before) {
    conditions.push('expire_date <= @expire_before')
    params.expire_before = expire_before
  }
  if (expire_after) {
    conditions.push('expire_date >= @expire_after')
    params.expire_after = expire_after
  }

  const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''

  const totalRow = db.prepare(`SELECT COUNT(*) as count FROM qualifications ${whereClause}`).get(params) as { count: number }
  const total = totalRow.count

  const p = parseInt(page, 10)
  const ps = parseInt(page_size, 10)
  const offset = (p - 1) * ps

  const list = db.prepare(
    `SELECT * FROM qualifications ${whereClause} ORDER BY created_at DESC LIMIT @limit OFFSET @offset`
  ).all({ ...params, limit: ps, offset }) as Qualification[]

  res.json({
    success: true,
    data: { list, total, page: p, page_size: ps },
  })
})

router.get('/:id', (req: Request, res: Response): void => {
  const qual = db.prepare('SELECT * FROM qualifications WHERE id = ?').get(req.params.id) as Qualification | undefined
  if (!qual) {
    res.status(404).json({ success: false, error: '资质记录不存在' })
    return
  }

  const logs = db.prepare(
    'SELECT * FROM qualification_review_logs WHERE qualification_id = ? ORDER BY created_at DESC'
  ).all(qual.id) as QualificationReviewLog[]

  res.json({ success: true, data: { ...qual, logs } })
})

router.post('/', (req: Request, res: Response): void => {
  const session = getSession()
  const { customer_name, license_type, license_no, expire_date } = req.body as {
    customer_name: string
    license_type: string
    license_no: string
    expire_date: string
  }

  if (!customer_name || !license_type || !license_no || !expire_date) {
    res.status(400).json({ success: false, error: '缺少必填字段' })
    return
  }

  const id = uuid()
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19)

  db.prepare(`
    INSERT INTO qualifications (id, customer_name, license_type, license_no, status, submitted_by, expire_date, created_at, updated_at)
    VALUES (?, ?, ?, ?, 'pending', ?, ?, ?, ?)
  `).run(id, customer_name, license_type, license_no, session.name, expire_date, now, now)

  db.prepare(`
    INSERT INTO qualification_review_logs (id, qualification_id, action, operator, role, note, created_at)
    VALUES (?, ?, 'submit', ?, 'sales_clerk', '提交资质申请', ?)
  `).run(uuid(), id, session.name, now)

  const qual = db.prepare('SELECT * FROM qualifications WHERE id = ?').get(id) as Qualification
  res.status(201).json({ success: true, data: qual })
})

router.put('/:id', (req: Request, res: Response): void => {
  const qual = db.prepare('SELECT * FROM qualifications WHERE id = ?').get(req.params.id) as Qualification | undefined
  if (!qual) {
    res.status(404).json({ success: false, error: '资质记录不存在' })
    return
  }

  if (qual.status !== 'pending' && qual.status !== 'rejected') {
    res.status(400).json({ success: false, error: '当前状态不允许编辑' })
    return
  }

  const { customer_name, license_type, license_no, expire_date } = req.body as {
    customer_name?: string
    license_type?: string
    license_no?: string
    expire_date?: string
  }

  const now = new Date().toISOString().replace('T', ' ').slice(0, 19)
  db.prepare(`
    UPDATE qualifications
    SET customer_name = COALESCE(?, customer_name),
        license_type = COALESCE(?, license_type),
        license_no = COALESCE(?, license_no),
        expire_date = COALESCE(?, expire_date),
        status = 'pending',
        updated_at = ?
    WHERE id = ?
  `).run(customer_name ?? null, license_type ?? null, license_no ?? null, expire_date ?? null, now, req.params.id)

  const updated = db.prepare('SELECT * FROM qualifications WHERE id = ?').get(req.params.id) as Qualification
  res.json({ success: true, data: updated })
})

router.post('/:id/review', (req: Request, res: Response): void => {
  const session = getSession()
  const qual = db.prepare('SELECT * FROM qualifications WHERE id = ?').get(req.params.id) as Qualification | undefined
  if (!qual) {
    res.status(404).json({ success: false, error: '资质记录不存在' })
    return
  }

  const { action, note } = req.body as { action: 'approve' | 'reject'; note?: string }
  if (!action || !['approve', 'reject'].includes(action)) {
    res.status(400).json({ success: false, error: '无效的审核操作' })
    return
  }

  const now = new Date().toISOString().replace('T', ' ').slice(0, 19)
  const newStatus: QualificationStatus = action === 'approve' ? 'approved' : 'rejected'

  db.prepare(`
    UPDATE qualifications SET status = ?, reviewed_by = ?, review_note = ?, updated_at = ? WHERE id = ?
  `).run(newStatus, session.name, note ?? null, now, req.params.id)

  db.prepare(`
    INSERT INTO qualification_review_logs (id, qualification_id, action, operator, role, note, created_at)
    VALUES (?, ?, ?, ?, 'director', ?, ?)
  `).run(uuid(), req.params.id, action, session.name, note ?? null, now)

  const relatedPurchases = db.prepare(
    'SELECT id FROM purchases WHERE qualification_id = ?'
  ).all(req.params.id) as Array<{ id: string }>

  const updateQStatus = db.prepare(
    'UPDATE purchases SET qualification_status = ?, updated_at = ? WHERE id = ?'
  )
  const insertLog = db.prepare(
    `INSERT INTO purchase_flow_logs (id, purchase_id, action, operator, role, note, created_at)
     VALUES (?, ?, 'qualification_status_change', ?, 'director', ?, ?)`
  )

  const logNote = action === 'approve'
    ? `关联客户资质已审核通过，资质状态更新为 ${newStatus}`
    : `关联客户资质已驳回，资质状态更新为 ${newStatus}`

  for (const p of relatedPurchases) {
    updateQStatus.run(newStatus, now, p.id)
    insertLog.run(uuid(), p.id, session.name, logNote, now)
  }

  const updated = db.prepare('SELECT * FROM qualifications WHERE id = ?').get(req.params.id) as Qualification
  res.json({ success: true, data: updated })
})

router.delete('/:id', (req: Request, res: Response): void => {
  const qual = db.prepare('SELECT * FROM qualifications WHERE id = ?').get(req.params.id) as Qualification | undefined
  if (!qual) {
    res.status(404).json({ success: false, error: '资质记录不存在' })
    return
  }

  const relatedPurchases = db.prepare(
    'SELECT COUNT(*) as count FROM purchases WHERE qualification_id = ?'
  ).get(req.params.id) as { count: number }

  if (relatedPurchases.count > 0) {
    res.status(400).json({ success: false, error: '该资质关联了采购单，无法删除' })
    return
  }

  db.prepare('DELETE FROM qualification_review_logs WHERE qualification_id = ?').run(req.params.id)
  db.prepare('DELETE FROM qualifications WHERE id = ?').run(req.params.id)

  res.json({ success: true, data: null })
})

export default router
