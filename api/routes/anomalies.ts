import { Router, type Request, type Response } from 'express'
import db from '../db.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  const { status, coop } = req.query

  let sql = `
    SELECT a.*, c.code as coop_code, c.name as coop_name,
      r.name as reporter_name, asgn.name as assignee_name
    FROM anomalies a
    LEFT JOIN coops c ON a.coop_id = c.id
    LEFT JOIN users r ON a.reporter_id = r.id
    LEFT JOIN users asgn ON a.assignee_id = asgn.id
    WHERE 1=1
  `
  const params: unknown[] = []

  if (status) {
    sql += ' AND a.status = ?'
    params.push(status)
  }

  if (coop) {
    sql += ' AND c.code = ?'
    params.push(coop)
  }

  sql += ' ORDER BY a.created_at DESC'

  const anomalies = db.prepare(sql).all(...params)
  res.json({ success: true, data: anomalies })
})

router.get('/:id', (req: Request, res: Response): void => {
  const anomaly = db.prepare(`
    SELECT a.*, c.code as coop_code, c.name as coop_name,
      r.name as reporter_name, asgn.name as assignee_name
    FROM anomalies a
    LEFT JOIN coops c ON a.coop_id = c.id
    LEFT JOIN users r ON a.reporter_id = r.id
    LEFT JOIN users asgn ON a.assignee_id = asgn.id
    WHERE a.id = ?
  `).get(req.params.id) as Record<string, unknown> | undefined

  if (!anomaly) {
    res.status(404).json({ success: false, error: '异常记录不存在' })
    return
  }

  const timeline = db.prepare(`
    SELECT t.*, u.name as operator_name
    FROM anomaly_timeline t
    LEFT JOIN users u ON t.operator_id = u.id
    WHERE t.anomaly_id = ?
    ORDER BY t.created_at ASC
  `).all(req.params.id)

  const attachments = db.prepare(
    'SELECT * FROM attachments WHERE entity_type = ? AND entity_id = ?'
  ).all('anomaly', req.params.id)

  res.json({ success: true, data: { ...anomaly, timeline, attachments } })
})

router.get('/:id/timeline', (req: Request, res: Response): void => {
  const anomaly = db.prepare('SELECT id FROM anomalies WHERE id = ?').get(req.params.id)
  if (!anomaly) {
    res.status(404).json({ success: false, error: '异常记录不存在' })
    return
  }

  const timeline = db.prepare(`
    SELECT t.*, u.name as operator_name
    FROM anomaly_timeline t
    LEFT JOIN users u ON t.operator_id = u.id
    WHERE t.anomaly_id = ?
    ORDER BY t.created_at ASC
  `).all(req.params.id)

  res.json({ success: true, data: timeline })
})

router.post('/', (req: Request, res: Response): void => {
  const { type, source_type, source_id, coop_id, description, severity } = req.body

  if (!type || !coop_id || !description) {
    res.status(400).json({ success: false, error: '请填写必要信息' })
    return
  }

  const reporterId = req.user?.id
  if (!reporterId) {
    res.status(401).json({ success: false, error: '未登录' })
    return
  }

  const now = Math.floor(Date.now() / 1000)

  const result = db.prepare(`
    INSERT INTO anomalies (type, source_type, source_id, coop_id, description, severity, status, reporter_id, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(type, source_type ?? null, source_id ?? null, coop_id, description, severity ?? 'medium', 'open', reporterId, now)

  db.prepare(`
    INSERT INTO anomaly_timeline (anomaly_id, action, content, operator_id, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(result.lastInsertRowid, 'created', '异常已上报', reporterId, now)

  const managers = db.prepare("SELECT id FROM users WHERE role = 'manager'").all() as { id: number }[]
  const insertNotification = db.prepare(`
    INSERT INTO notifications (user_id, title, content, type, created_at)
    VALUES (?, ?, ?, ?, ?)
  `)
  for (const m of managers) {
    const coop = db.prepare('SELECT name FROM coops WHERE id = ?').get(coop_id) as { name: string } | undefined
    insertNotification.run(m.id, '新异常上报', `${coop?.name ?? '鸡舍'}发现新异常：${description}`, 'anomaly', now)
  }

  res.json({ success: true, data: { id: result.lastInsertRowid } })
})

router.patch('/:id', (req: Request, res: Response): void => {
  const { action, content, assignee_id, severity } = req.body

  const anomaly = db.prepare('SELECT * FROM anomalies WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined
  if (!anomaly) {
    res.status(404).json({ success: false, error: '异常记录不存在' })
    return
  }

  const operatorId = req.user?.id
  if (!operatorId) {
    res.status(401).json({ success: false, error: '未登录' })
    return
  }

  const now = Math.floor(Date.now() / 1000)
  let newStatus = anomaly.status as string
  let timelineAction = action
  let timelineContent = content ?? ''

  switch (action) {
    case 'assign':
      newStatus = 'assigned'
      if (assignee_id) {
        db.prepare('UPDATE anomalies SET status = ?, assignee_id = ? WHERE id = ?').run(newStatus, assignee_id, req.params.id)
        const assignee = db.prepare('SELECT name FROM users WHERE id = ?').get(assignee_id) as { name: string } | undefined
        timelineContent = timelineContent || `已指派给${assignee?.name ?? '未知'}处理`
      }
      break
    case 'escalate':
      if (severity) {
        db.prepare('UPDATE anomalies SET severity = ? WHERE id = ?').run(severity, req.params.id)
      }
      timelineContent = timelineContent || '异常已升级'
      break
    case 'process':
      newStatus = 'processing'
      db.prepare('UPDATE anomalies SET status = ? WHERE id = ?').run(newStatus, req.params.id)
      timelineContent = timelineContent || '开始处理异常'
      break
    case 'resolve':
      newStatus = 'resolved'
      db.prepare('UPDATE anomalies SET status = ?, resolved_at = ? WHERE id = ?').run(newStatus, now, req.params.id)
      timelineContent = timelineContent || '异常已解决'
      break
    case 'close':
      newStatus = 'closed'
      db.prepare('UPDATE anomalies SET status = ? WHERE id = ?').run(newStatus, req.params.id)
      timelineContent = timelineContent || '异常已关闭'
      break
    case 'reject':
      newStatus = 'open'
      db.prepare('UPDATE anomalies SET status = ?, assignee_id = NULL WHERE id = ?').run(newStatus, req.params.id)
      timelineContent = timelineContent || '已驳回，重新打开'
      break
    case 'update':
      timelineAction = 'update'
      timelineContent = timelineContent || '更新处理进度'
      break
    default:
      res.status(400).json({ success: false, error: '无效操作' })
      return
  }

  db.prepare(`
    INSERT INTO anomaly_timeline (anomaly_id, action, content, operator_id, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(req.params.id, timelineAction, timelineContent, operatorId, now)

  res.json({ success: true, data: { id: Number(req.params.id) } })
})

export default router
