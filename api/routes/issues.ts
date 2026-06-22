import crypto from 'crypto'
import { Router, type Request, type Response } from 'express'
import { getDb } from '../db.js'
import { getRoleInfo } from './role.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  const db = getDb()
  const { status, assignee, severity } = req.query

  let sql = 'SELECT i.*, p.name as project_name, p.location as project_location, p.status as project_status, jm.title as test_title FROM issues i LEFT JOIN projects p ON i.project_id = p.id LEFT JOIN joint_tests jm ON i.test_id = jm.id WHERE 1=1 '
  const params: any[] = []

  if (status) { sql += ' AND i.status = ?'; params.push(status) }
  if (assignee) { sql += ' AND i.assignee = ?'; params.push(assignee) }
  if (severity) { sql += ' AND i.severity = ?'; params.push(severity) }

  sql += ' ORDER BY i.created_at DESC'
  const issues = db.prepare(sql).all(...params)
  res.json({ success: true, data: issues })
})

router.get('/:id', (req: Request, res: Response): void => {
  const db = getDb()
  const issue = db.prepare('SELECT i.*, p.name as project_name, p.location as project_location, p.status as project_status FROM issues i LEFT JOIN projects p ON i.project_id = p.id WHERE i.id = ?').get(req.params.id)

  if (!issue) { res.status(404).json({ success: false, error: '\u95EE\u9898\u4E0D\u5B58\u5728' }); return }

  const progresses = db.prepare('SELECT * FROM issue_progresses WHERE issue_id = ? ORDER BY created_at').all(req.params.id)
  const logs = db.prepare('SELECT * FROM operation_logs WHERE entity_type = ? AND entity_id = ? ORDER BY created_at DESC').all('issue', req.params.id)

  let sourceTest = null
  let sourceItem = null
  if (issue.test_id) { sourceTest = db.prepare('SELECT * FROM joint_tests WHERE id = ?').get(issue.test_id) }
  if (issue.test_item_id) { sourceItem = db.prepare('SELECT * FROM test_items WHERE id = ?').get(issue.test_item_id) }

  const result = { ...issue, project: issue.project_name ? { id: issue.project_id, name: issue.project_name, location: issue.project_location, status: issue.project_status } : null, progresses, sourceTest, sourceItem, logs }
  res.json({ success: true, data: result })
})

router.post('/', (req: Request, res: Response): void => {
  const db = getDb()
  const { test_id, test_item_id, project_id, title, severity, description, assignee } = req.body

  if (!project_id || !title || !severity) { res.status(400).json({ success: false, error: '\u9879\u76EEID\u548C\u6807\u9898\u4E3A\u5FC5\u586B\u9879' }); return }

  const id = crypto.randomUUID()
  const roleInfo = getRoleInfo()
  const status = assignee ? 'in_progress' : 'pending_assign'

  db.prepare('INSERT INTO issues (id, test_id, test_item_id, project_id, title, severity, status, assignee, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .run(id, test_id || null, test_item_id || null, project_id, title, severity, status, assignee || null, description || null)

  db.prepare('INSERT INTO operation_logs (id, entity_type, entity_id, action, operator_role, operator_name, detail) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(crypto.randomUUID(), 'issue', id, 'create', roleInfo.role, roleInfo.name, '\u521B\u5EFA\u95EE\u9898\uFF1A' + title)

  if (assignee) {
    db.prepare('INSERT INTO issue_progresses (id, issue_id, description, operator, action_type) VALUES (?, ?, ?, ?, ?)')
      .run(crypto.randomUUID(), id, '\u5206\u914D\u7ED9\uFF1A' + assignee, roleInfo.name, 'assign')
    db.prepare('INSERT INTO operation_logs (id, entity_type, entity_id, action, operator_role, operator_name, detail) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(crypto.randomUUID(), 'issue', id, 'assign', roleInfo.role, roleInfo.name, '\u5206\u914D\u7ED9\uFF1A' + assignee)
  }

  const result = db.prepare('SELECT * FROM issues WHERE id = ?').get(id)
  res.json({ success: true, data: result })
})

router.put('/:id/assign', (req: Request, res: Response): void => {
  const db = getDb()
  const { assignee } = req.body

  if (!assignee) { res.status(400).json({ success: false, error: '\u5206\u914D\u4EBA\u4E3A\u5FC5\u586B\u9879' }); return }

  const issue = db.prepare('SELECT * FROM issues WHERE id = ?').get(req.params.id)
  if (!issue) { res.status(404).json({ success: false, error: '\u95EE\u9898\u4E0D\u5B58\u5728' }); return }

  db.prepare(`UPDATE issues SET assignee = ?, status = ?, updated_at = datetime('now') WHERE id = ?`).run(assignee, 'in_progress', req.params.id)

  const roleInfo = getRoleInfo()
  db.prepare('INSERT INTO issue_progresses (id, issue_id, description, operator, action_type) VALUES (?, ?, ?, ?, ?)')
    .run(crypto.randomUUID(), req.params.id, '\u5206\u914D\u7ED9\uFF1A' + assignee, roleInfo.name, 'assign')
  db.prepare('INSERT INTO operation_logs (id, entity_type, entity_id, action, operator_role, operator_name, detail) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(crypto.randomUUID(), 'issue', req.params.id, 'assign', roleInfo.role, roleInfo.name, '\u5206\u914D\u7ED9\uFF1A' + assignee)

  const result = db.prepare('SELECT * FROM issues WHERE id = ?').get(req.params.id)
  res.json({ success: true, data: result })
})

router.put('/:id/progress', (req: Request, res: Response): void => {
  const db = getDb()
  const { description } = req.body

  if (!description) { res.status(400).json({ success: false, error: '\u63CF\u8FF0\u4E3A\u5FC5\u586B\u9879' }); return }

  const issue = db.prepare('SELECT * FROM issues WHERE id = ?').get(req.params.id)
  if (!issue) { res.status(404).json({ success: false, error: '\u95EE\u9898\u4E0D\u5B58\u5728' }); return }

  const roleInfo = getRoleInfo()
  db.prepare('INSERT INTO issue_progresses (id, issue_id, description, operator, action_type) VALUES (?, ?, ?, ?, ?)')
    .run(crypto.randomUUID(), req.params.id, description, roleInfo.name, 'progress')
  db.prepare(`UPDATE issues SET updated_at = datetime('now') WHERE id = ?`).run(req.params.id)
  db.prepare('INSERT INTO operation_logs (id, entity_type, entity_id, action, operator_role, operator_name, detail) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(crypto.randomUUID(), 'issue', req.params.id, 'progress', roleInfo.role, roleInfo.name, description)

  const result = db.prepare('SELECT * FROM issues WHERE id = ?').get(req.params.id)
  const progresses = db.prepare('SELECT * FROM issue_progresses WHERE issue_id = ? ORDER BY created_at').all(req.params.id)
  res.json({ success: true, data: { ...result, progresses } })
})

router.put('/:id/complete', (req: Request, res: Response): void => {
  const db = getDb()
  const issue = db.prepare('SELECT * FROM issues WHERE id = ?').get(req.params.id)
  if (!issue) { res.status(404).json({ success: false, error: '\u95EE\u9898\u4E0D\u5B58\u5728' }); return }

  const roleInfo = getRoleInfo()

  db.prepare(`UPDATE issues SET status = ?, updated_at = datetime('now') WHERE id = ?`).run('pending_verify', req.params.id)

  db.prepare('INSERT INTO issue_progresses (id, issue_id, description, operator, action_type) VALUES (?, ?, ?, ?, ?)')
    .run(crypto.randomUUID(), req.params.id, '\u6574\u6539\u5B8C\u6210\uFF0C\u5F85\u9A8C\u8BC1', roleInfo.name, 'complete')
  db.prepare('INSERT INTO operation_logs (id, entity_type, entity_id, action, operator_role, operator_name, detail) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(crypto.randomUUID(), 'issue', req.params.id, 'complete', roleInfo.role, roleInfo.name, '\u6574\u6539\u5B8C\u6210\uFF0C\u5F85\u9A8C\u8BC1')

  const result = db.prepare('SELECT * FROM issues WHERE id = ?').get(req.params.id)
  res.json({ success: true, data: result })
})

router.put('/:id/verify', (req: Request, res: Response): void => {
  const db = getDb()
  const { passed, remark } = req.body

  if (passed === undefined) { res.status(400).json({ success: false, error: 'passed\u4E3A\u5FC5\u586B\u9879' }); return }

  const issue = db.prepare('SELECT * FROM issues WHERE id = ?').get(req.params.id)
  if (!issue) { res.status(404).json({ success: false, error: '\u95EE\u9898\u4E0D\u5B58\u5728' }); return }

  const roleInfo = getRoleInfo()

  if (passed) {
    db.prepare(`UPDATE issues SET status = ?, closed_at = datetime('now'), updated_at = datetime('now') WHERE id = ?`).run('closed', req.params.id)
    db.prepare('INSERT INTO issue_progresses (id, issue_id, description, operator, action_type) VALUES (?, ?, ?, ?, ?)')
      .run(crypto.randomUUID(), req.params.id, remark || '\u9A8C\u8BC1\u901A\u8FC7\uFF0C\u95EE\u9898\u5173\u95ED', roleInfo.name, 'verify')
    db.prepare('INSERT INTO operation_logs (id, entity_type, entity_id, action, operator_role, operator_name, detail) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(crypto.randomUUID(), 'issue', req.params.id, 'verify', roleInfo.role, roleInfo.name, remark || '\u9A8C\u8BC1\u901A\u8FC7\uFF0C\u95EE\u9898\u5173\u95ED')
  } else {
    db.prepare(`UPDATE issues SET status = ?, updated_at = datetime('now') WHERE id = ?`).run('in_progress', req.params.id)
    db.prepare('INSERT INTO issue_progresses (id, issue_id, description, operator, action_type) VALUES (?, ?, ?, ?, ?)')
      .run(crypto.randomUUID(), req.params.id, remark || '\u9A8C\u8BC1\u672A\u901A\u8FC7\uFF0C\u9700\u8981\u7EE7\u7EED\u6574\u6539', roleInfo.name, 'reject')
    db.prepare('INSERT INTO operation_logs (id, entity_type, entity_id, action, operator_role, operator_name, detail) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(crypto.randomUUID(), 'issue', req.params.id, 'reject', roleInfo.role, roleInfo.name, remark || '\u9A8C\u8BC1\u672A\u901A\u8FC7\uFF0C\u9700\u8981\u7EE7\u7EED\u6574\u6539')
  }

  const result = db.prepare('SELECT * FROM issues WHERE id = ?').get(req.params.id)
  const progresses = db.prepare('SELECT * FROM issue_progresses WHERE issue_id = ? ORDER BY created_at').all(req.params.id)
  res.json({ success: true, data: { ...result, progresses } })
})

export default router
