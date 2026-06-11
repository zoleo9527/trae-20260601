import { Router, type Request, type Response } from 'express'
import { getDb, clearApplicationData } from '../db.js'
import type { VenueApproval, ApprovalLog } from '../types.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  const db = getDb()
  const { status } = req.query

  let sql = `
    SELECT v.*, a.activityName as applicationName, t.name as tenantName
    FROM venue_approvals v
    LEFT JOIN activity_applications a ON v.applicationId = a.id
    LEFT JOIN tenants t ON a.tenantId = t.id
    WHERE 1=1
  `
  const params: unknown[] = []

  if (status) {
    sql += ' AND v.status = ?'
    params.push(status)
  }

  sql += ' ORDER BY v.createdAt DESC'

  const approvals = db.prepare(sql).all(...params) as VenueApproval[]
  res.json({ success: true, data: approvals })
})

router.get('/:id', (req: Request, res: Response): void => {
  const db = getDb()
  const id = Number(req.params.id)

  const approval = db.prepare(`
    SELECT v.*, a.activityName as applicationName, a.activityDate, a.description,
           t.name as tenantName, t.shopNo, t.contact, t.phone, t.category
    FROM venue_approvals v
    LEFT JOIN activity_applications a ON v.applicationId = a.id
    LEFT JOIN tenants t ON a.tenantId = t.id
    WHERE v.id = ?
  `).get(id) as VenueApproval & { activityDate?: string; description?: string; shopNo?: string; contact?: string; phone?: string; category?: string } | undefined

  if (!approval) {
    res.status(404).json({ success: false, error: '审批不存在' })
    return
  }

  const logs = db.prepare(
    'SELECT * FROM approval_logs WHERE approvalId = ? ORDER BY createdAt ASC'
  ).all(id) as ApprovalLog[]

  res.json({ success: true, data: { ...approval, logs } })
})

router.put('/:id/approve', (req: Request, res: Response): void => {
  const db = getDb()
  const id = Number(req.params.id)
  const { operator, remark } = req.body

  const approval = db.prepare('SELECT * FROM venue_approvals WHERE id = ?').get(id) as VenueApproval | undefined
  if (!approval) {
    res.status(404).json({ success: false, error: '审批不存在' })
    return
  }
  if (approval.status !== 'pending') {
    res.status(400).json({ success: false, error: '当前状态无法审批' })
    return
  }

  db.prepare("UPDATE venue_approvals SET status = 'approved', updatedAt = datetime('now','localtime') WHERE id = ?").run(id)
  db.prepare(`
    INSERT INTO approval_logs (approvalId, action, operator, remark)
    VALUES (?, 'approved', ?, ?)
  `).run(id, operator || '工程部', remark || '审批通过')

  res.json({ success: true, data: { ...approval, status: 'approved' } })
})

router.put('/:id/reject', (req: Request, res: Response): void => {
  const db = getDb()
  const id = Number(req.params.id)
  const { operator, remark } = req.body

  const approval = db.prepare('SELECT * FROM venue_approvals WHERE id = ?').get(id) as VenueApproval | undefined
  if (!approval) {
    res.status(404).json({ success: false, error: '审批不存在' })
    return
  }
  if (approval.status !== 'pending') {
    res.status(400).json({ success: false, error: '当前状态无法退回' })
    return
  }

  db.prepare("UPDATE venue_approvals SET status = 'rejected', updatedAt = datetime('now','localtime') WHERE id = ?").run(id)
  db.prepare(`
    INSERT INTO approval_logs (approvalId, action, operator, remark)
    VALUES (?, 'rejected', ?, ?)
  `).run(id, operator || '工程部', remark || '审批退回')

  const app = db.prepare('SELECT * FROM activity_applications WHERE approvalId = ?').get(id) as { id: number } | undefined
  if (app) {
    db.prepare("UPDATE activity_applications SET status = 'returned', updatedAt = datetime('now','localtime') WHERE id = ?").run(app.id)
    db.prepare(`
      INSERT INTO application_logs (applicationId, action, operator, remark)
      VALUES (?, 'returned', ?, ?)
    `).run(app.id, operator || '工程部', remark || '场地审批退回')
  }

  res.json({ success: true, data: { ...approval, status: 'rejected' } })
})

router.put('/:id/supplement', (req: Request, res: Response): void => {
  const db = getDb()
  const id = Number(req.params.id)
  const { operator, remark } = req.body

  const approval = db.prepare('SELECT * FROM venue_approvals WHERE id = ?').get(id) as VenueApproval | undefined
  if (!approval) {
    res.status(404).json({ success: false, error: '审批不存在' })
    return
  }
  if (approval.status !== 'rejected') {
    res.status(400).json({ success: false, error: '当前状态无法补充意见重新提交' })
    return
  }

  db.prepare("UPDATE venue_approvals SET status = 'pending', updatedAt = datetime('now','localtime') WHERE id = ?").run(id)
  db.prepare(`
    INSERT INTO approval_logs (approvalId, action, operator, remark)
    VALUES (?, 'supplemented', ?, ?)
  `).run(id, operator || '营运专员', remark || '补充意见后重新提交')

  const app = db.prepare('SELECT * FROM activity_applications WHERE approvalId = ?').get(id) as { id: number } | undefined
  if (app) {
    db.prepare("UPDATE activity_applications SET status = 'supplemented', updatedAt = datetime('now','localtime') WHERE id = ?").run(app.id)
    db.prepare(`
      INSERT INTO application_logs (applicationId, action, operator, remark)
      VALUES (?, 'supplemented', ?, ?)
    `).run(app.id, operator || '营运专员', remark || '补充资料重新提交审批')
  }

  res.json({ success: true, data: { ...approval, status: 'pending' } })
})

router.delete('/', (req: Request, res: Response): void => {
  clearApplicationData()
  res.json({ success: true, message: '场地审批数据已重置' })
})

export default router
