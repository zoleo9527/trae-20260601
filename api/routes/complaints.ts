import { Router, type Request, type Response } from 'express'
import { getDb } from '../db.js'
import type { Complaint, ComplaintLog } from '../types.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  const db = getDb()
  const { status, tenantId } = req.query

  let sql = `
    SELECT c.*, t.name as tenantName, t.shopNo as tenantShopNo
    FROM complaints c
    LEFT JOIN tenants t ON c.tenantId = t.id
    WHERE 1=1
  `
  const params: unknown[] = []

  if (status) {
    sql += ' AND c.status = ?'
    params.push(status)
  }
  if (tenantId) {
    sql += ' AND c.tenantId = ?'
    params.push(Number(tenantId))
  }

  sql += ' ORDER BY c.createdAt DESC'

  const complaints = db.prepare(sql).all(...params) as Complaint[]
  res.json({ success: true, data: complaints })
})

router.get('/tenant/:tenantId', (req: Request, res: Response): void => {
  const db = getDb()
  const tenantId = Number(req.params.tenantId)

  const complaints = db.prepare(`
    SELECT c.*, t.name as tenantName, t.shopNo as tenantShopNo
    FROM complaints c
    LEFT JOIN tenants t ON c.tenantId = t.id
    WHERE c.tenantId = ?
    ORDER BY c.createdAt DESC
  `).all(tenantId) as Complaint[]

  res.json({ success: true, data: complaints })
})

router.get('/:id', (req: Request, res: Response): void => {
  const db = getDb()
  const id = Number(req.params.id)

  const complaint = db.prepare(`
    SELECT c.*, t.name as tenantName, t.shopNo as tenantShopNo
    FROM complaints c
    LEFT JOIN tenants t ON c.tenantId = t.id
    WHERE c.id = ?
  `).get(id) as Complaint | undefined

  if (!complaint) {
    res.status(404).json({ success: false, error: '投诉不存在' })
    return
  }

  const logs = db.prepare(
    'SELECT * FROM complaint_logs WHERE complaintId = ? ORDER BY createdAt ASC'
  ).all(id) as ComplaintLog[]

  res.json({ success: true, data: { ...complaint, logs } })
})

router.post('/', (req: Request, res: Response): void => {
  const db = getDb()
  const { tenantId, title, content, category, operator } = req.body

  if (!tenantId || !title) {
    res.status(400).json({ success: false, error: '缺少必填字段' })
    return
  }

  const result = db.prepare(`
    INSERT INTO complaints (tenantId, title, content, category)
    VALUES (?, ?, ?, ?)
  `).run(tenantId, title, content || '', category || '')
  const complaintId = Number(result.lastInsertRowid)

  db.prepare(`
    INSERT INTO complaint_logs (complaintId, action, operator, remark)
    VALUES (?, 'created', ?, ?)
  `).run(complaintId, operator || '客服台', '登记投诉')

  const complaint = db.prepare(`
    SELECT c.*, t.name as tenantName, t.shopNo as tenantShopNo
    FROM complaints c
    LEFT JOIN tenants t ON c.tenantId = t.id
    WHERE c.id = ?
  `).get(complaintId)

  res.json({ success: true, data: complaint })
})

router.put('/:id/process', (req: Request, res: Response): void => {
  const db = getDb()
  const id = Number(req.params.id)
  const { operator, remark } = req.body

  const complaint = db.prepare('SELECT * FROM complaints WHERE id = ?').get(id) as Complaint | undefined
  if (!complaint) {
    res.status(404).json({ success: false, error: '投诉不存在' })
    return
  }
  if (complaint.status !== 'open') {
    res.status(400).json({ success: false, error: '当前状态无法处理' })
    return
  }

  db.prepare("UPDATE complaints SET status = 'processing', updatedAt = datetime('now','localtime') WHERE id = ?").run(id)
  db.prepare(`
    INSERT INTO complaint_logs (complaintId, action, operator, remark)
    VALUES (?, 'processed', ?, ?)
  `).run(id, operator || '工程部', remark || '已安排处理')

  const updated = db.prepare(`
    SELECT c.*, t.name as tenantName, t.shopNo as tenantShopNo
    FROM complaints c
    LEFT JOIN tenants t ON c.tenantId = t.id
    WHERE c.id = ?
  `).get(id)

  res.json({ success: true, data: updated })
})

router.put('/:id/resolve', (req: Request, res: Response): void => {
  const db = getDb()
  const id = Number(req.params.id)
  const { operator, remark, result } = req.body

  const complaint = db.prepare('SELECT * FROM complaints WHERE id = ?').get(id) as Complaint | undefined
  if (!complaint) {
    res.status(404).json({ success: false, error: '投诉不存在' })
    return
  }
  if (complaint.status !== 'processing') {
    res.status(400).json({ success: false, error: '当前状态无法结案' })
    return
  }

  db.prepare("UPDATE complaints SET status = 'resolved', result = ?, updatedAt = datetime('now','localtime') WHERE id = ?")
    .run(result || remark || '已处理', id)
  db.prepare(`
    INSERT INTO complaint_logs (complaintId, action, operator, remark)
    VALUES (?, 'resolved', ?, ?)
  `).run(id, operator || '客服台', remark || '已确认处理结果')

  const updated = db.prepare(`
    SELECT c.*, t.name as tenantName, t.shopNo as tenantShopNo
    FROM complaints c
    LEFT JOIN tenants t ON c.tenantId = t.id
    WHERE c.id = ?
  `).get(id)

  res.json({ success: true, data: updated })
})

export default router
