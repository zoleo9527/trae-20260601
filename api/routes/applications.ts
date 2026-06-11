import { Router, type Request, type Response } from 'express'
import { getDb, clearApplicationData } from '../db.js'
import type { ActivityApplication, ApplicationLog } from '../types.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  const db = getDb()
  const { status, tenant } = req.query

  let sql = `
    SELECT a.*, t.name as tenantName, t.shopNo as tenantShopNo
    FROM activity_applications a
    LEFT JOIN tenants t ON a.tenantId = t.id
    WHERE 1=1
  `
  const params: unknown[] = []

  if (status) {
    sql += ' AND a.status = ?'
    params.push(status)
  }
  if (tenant) {
    sql += ' AND t.name LIKE ?'
    params.push(`%${tenant}%`)
  }

  sql += ' ORDER BY a.createdAt DESC'

  const applications = db.prepare(sql).all(...params) as ActivityApplication[]
  res.json({ success: true, data: applications })
})

router.get('/:id', (req: Request, res: Response): void => {
  const db = getDb()
  const id = Number(req.params.id)

  const app = db.prepare(`
    SELECT a.*, t.name as tenantName, t.shopNo as tenantShopNo
    FROM activity_applications a
    LEFT JOIN tenants t ON a.tenantId = t.id
    WHERE a.id = ?
  `).get(id) as ActivityApplication | undefined

  if (!app) {
    res.status(404).json({ success: false, error: '申请不存在' })
    return
  }

  const logs = db.prepare(
    'SELECT * FROM application_logs WHERE applicationId = ? ORDER BY createdAt ASC'
  ).all(id) as ApplicationLog[]

  res.json({ success: true, data: { ...app, logs } })
})

router.post('/', (req: Request, res: Response): void => {
  const db = getDb()
  const { tenantId, activityName, activityDate, venueName, description, operator } = req.body

  if (!tenantId || !activityName || !activityDate || !venueName) {
    res.status(400).json({ success: false, error: '缺少必填字段' })
    return
  }

  const insertApp = db.prepare(`
    INSERT INTO activity_applications (tenantId, activityName, activityDate, venueName, description)
    VALUES (?, ?, ?, ?, ?)
  `)
  const result = insertApp.run(tenantId, activityName, activityDate, venueName, description || '')
  const appId = Number(result.lastInsertRowid)

  const insertApproval = db.prepare(`
    INSERT INTO venue_approvals (applicationId, venueName)
    VALUES (?, ?)
  `)
  const approvalResult = insertApproval.run(appId, venueName)
  const approvalId = Number(approvalResult.lastInsertRowid)

  db.prepare('UPDATE activity_applications SET approvalId = ? WHERE id = ?').run(approvalId, appId)

  db.prepare(`
    INSERT INTO application_logs (applicationId, action, operator, remark)
    VALUES (?, 'created', ?, ?)
  `).run(appId, operator || '营运专员', '创建活动申请')

  db.prepare(`
    INSERT INTO approval_logs (approvalId, action, operator, remark)
    VALUES (?, 'created', ?, ?)
  `).run(approvalId, '系统', '自动生成场地审批单')

  const app = db.prepare(`
    SELECT a.*, t.name as tenantName, t.shopNo as tenantShopNo
    FROM activity_applications a
    LEFT JOIN tenants t ON a.tenantId = t.id
    WHERE a.id = ?
  `).get(appId)

  res.json({ success: true, data: app })
})

router.put('/:id/process', (req: Request, res: Response): void => {
  const db = getDb()
  const id = Number(req.params.id)
  const { operator, remark } = req.body

  const app = db.prepare('SELECT * FROM activity_applications WHERE id = ?').get(id) as ActivityApplication | undefined
  if (!app) {
    res.status(404).json({ success: false, error: '申请不存在' })
    return
  }
  if (app.status !== 'pending' && app.status !== 'supplemented') {
    res.status(400).json({ success: false, error: '当前状态无法受理' })
    return
  }

  db.prepare("UPDATE activity_applications SET status = 'processing', updatedAt = datetime('now','localtime') WHERE id = ?").run(id)
  db.prepare(`
    INSERT INTO application_logs (applicationId, action, operator, remark)
    VALUES (?, 'processed', ?, ?)
  `).run(id, operator || '客服台', remark || '已受理，转交工程部审批')

  const updated = db.prepare(`
    SELECT a.*, t.name as tenantName, t.shopNo as tenantShopNo
    FROM activity_applications a
    LEFT JOIN tenants t ON a.tenantId = t.id
    WHERE a.id = ?
  `).get(id)

  res.json({ success: true, data: updated })
})

router.put('/:id/return', (req: Request, res: Response): void => {
  const db = getDb()
  const id = Number(req.params.id)
  const { operator, remark } = req.body

  const app = db.prepare('SELECT * FROM activity_applications WHERE id = ?').get(id) as ActivityApplication | undefined
  if (!app) {
    res.status(404).json({ success: false, error: '申请不存在' })
    return
  }
  if (app.status !== 'processing') {
    res.status(400).json({ success: false, error: '当前状态无法退回' })
    return
  }

  db.prepare("UPDATE activity_applications SET status = 'returned', updatedAt = datetime('now','localtime') WHERE id = ?").run(id)
  db.prepare(`
    INSERT INTO application_logs (applicationId, action, operator, remark)
    VALUES (?, 'returned', ?, ?)
  `).run(id, operator || '工程部', remark || '审批退回，需补充资料')

  if (app.approvalId) {
    db.prepare("UPDATE venue_approvals SET status = 'rejected', updatedAt = datetime('now','localtime') WHERE id = ?").run(app.approvalId)
    db.prepare(`
      INSERT INTO approval_logs (approvalId, action, operator, remark)
      VALUES (?, 'rejected', ?, ?)
    `).run(app.approvalId, operator || '工程部', remark || '审批退回')
  }

  const updated = db.prepare(`
    SELECT a.*, t.name as tenantName, t.shopNo as tenantShopNo
    FROM activity_applications a
    LEFT JOIN tenants t ON a.tenantId = t.id
    WHERE a.id = ?
  `).get(id)

  res.json({ success: true, data: updated })
})

router.put('/:id/supplement', (req: Request, res: Response): void => {
  const db = getDb()
  const id = Number(req.params.id)
  const { operator, remark, description } = req.body

  const app = db.prepare('SELECT * FROM activity_applications WHERE id = ?').get(id) as ActivityApplication | undefined
  if (!app) {
    res.status(404).json({ success: false, error: '申请不存在' })
    return
  }
  if (app.status !== 'returned') {
    res.status(400).json({ success: false, error: '当前状态无法补充资料' })
    return
  }

  db.prepare("UPDATE activity_applications SET status = 'supplemented', updatedAt = datetime('now','localtime'), description = ? WHERE id = ?")
    .run(description || app.description, id)

  db.prepare(`
    INSERT INTO application_logs (applicationId, action, operator, remark)
    VALUES (?, 'supplemented', ?, ?)
  `).run(id, operator || '营运专员', remark || '已补充资料，重新提交')

  if (app.approvalId) {
    db.prepare("UPDATE venue_approvals SET status = 'pending', updatedAt = datetime('now','localtime') WHERE id = ?").run(app.approvalId)
    db.prepare(`
      INSERT INTO approval_logs (approvalId, action, operator, remark)
      VALUES (?, 'supplemented', ?, ?)
    `).run(app.approvalId, operator || '营运专员', remark || '补充资料后重新提交审批')
  }

  const updated = db.prepare(`
    SELECT a.*, t.name as tenantName, t.shopNo as tenantShopNo
    FROM activity_applications a
    LEFT JOIN tenants t ON a.tenantId = t.id
    WHERE a.id = ?
  `).get(id)

  res.json({ success: true, data: updated })
})

router.put('/:id/close', (req: Request, res: Response): void => {
  const db = getDb()
  const id = Number(req.params.id)
  const { operator, remark } = req.body

  const app = db.prepare('SELECT * FROM activity_applications WHERE id = ?').get(id) as ActivityApplication | undefined
  if (!app) {
    res.status(404).json({ success: false, error: '申请不存在' })
    return
  }
  if (app.status !== 'pending' && app.status !== 'processing') {
    res.status(400).json({ success: false, error: '当前状态无法关闭' })
    return
  }

  db.prepare("UPDATE activity_applications SET status = 'closed', updatedAt = datetime('now','localtime') WHERE id = ?").run(id)
  db.prepare(`
    INSERT INTO application_logs (applicationId, action, operator, remark)
    VALUES (?, 'closed', ?, ?)
  `).run(id, operator || '营运专员', remark || '关闭申请')

  const updated = db.prepare(`
    SELECT a.*, t.name as tenantName, t.shopNo as tenantShopNo
    FROM activity_applications a
    LEFT JOIN tenants t ON a.tenantId = t.id
    WHERE a.id = ?
  `).get(id)

  res.json({ success: true, data: updated })
})

router.delete('/', (req: Request, res: Response): void => {
  clearApplicationData()
  res.json({ success: true, message: '活动申请数据已重置' })
})

export default router
