import { Router, type Request, type Response } from 'express'
import { getDb, getSlaHours, STATUS_FLOW } from '../db.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  const db = getDb()
  const { status, search, page = '1', pageSize = '10' } = req.query

  let sql = 'SELECT * FROM transfers WHERE 1=1'
  const params: any[] = []

  if (status) {
    sql += ' AND status = ?'
    params.push(status)
  }
  if (search) {
    sql += ' AND ear_tag LIKE ?'
    params.push(`%${search}%`)
  }

  const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as total')
  const total = (db.prepare(countSql).get(...params) as { total: number }).total

  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
  const p = Number(page)
  const ps = Number(pageSize)
  params.push(ps, (p - 1) * ps)

  const list = db.prepare(sql).all(...params) as any[]

  const enriched = list.map(t => {
    const flow = STATUS_FLOW[t.status]
    const now = new Date()
    const deadline = t.deadline_at ? new Date(t.deadline_at) : null
    const isOverdue = deadline ? deadline < now : false
    const hoursLeft = deadline ? Math.max(0, (deadline.getTime() - now.getTime()) / 3600000) : null

    return {
      ...t,
      nextAction: flow?.label || '',
      nextResponsible: flow?.responsible || '',
      isOverdue,
      hoursLeft: hoursLeft !== null ? Math.round(hoursLeft * 10) / 10 : null,
    }
  })

  res.json({ success: true, data: { list: enriched, total, page: p, pageSize: ps } })
})

router.post('/', (req: Request, res: Response): void => {
  const db = getDb()
  const { earTag, breed, ageDays, fromPen, toPen, reason, remark } = req.body
  const operator = (req as any).decodedName || req.headers['x-user-name'] as string || '未知'
  const operatorRole = (req as any).decodedRole || req.headers['x-user-role'] as string || '繁育员'

  const sla = getSlaHours('pending_transfer')
  const deadlineAt = new Date(Date.now() + sla * 3600000)
  const p = (n: number) => String(n).padStart(2, '0')
  const deadlineStr = `${deadlineAt.getFullYear()}-${p(deadlineAt.getMonth() + 1)}-${p(deadlineAt.getDate())} ${p(deadlineAt.getHours())}:${p(deadlineAt.getMinutes())}`

  const result = db.prepare(`
    INSERT INTO transfers (ear_tag, breed, age_days, from_pen, to_pen, reason, remark, status, operator, operator_role, deadline_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'pending_transfer', ?, ?, ?)
  `).run(earTag, breed, ageDays, fromPen, toPen, reason, remark || '', operator, operatorRole, deadlineStr)

  db.prepare(`
    INSERT INTO operation_logs (transfer_id, operator, operator_role, action, detail, remark)
    VALUES (?, ?, ?, 'create', ?, ?)
  `).run(Number(result.lastInsertRowid), operator, operatorRole, `创建转栏记录 ${earTag}`, remark || '')

  const transfer = db.prepare('SELECT * FROM transfers WHERE id = ?').get(Number(result.lastInsertRowid))
  res.json({ success: true, data: transfer })
})

router.get('/:id', (req: Request, res: Response): void => {
  const db = getDb()
  const id = Number(req.params.id)

  const transfer = db.prepare('SELECT * FROM transfers WHERE id = ?').get(id) as any
  if (!transfer) {
    res.status(404).json({ success: false, error: '记录不存在' })
    return
  }

  const timeline = db.prepare(
    'SELECT * FROM operation_logs WHERE transfer_id = ? ORDER BY created_at ASC'
  ).all(id) as any[]

  const assessment = db.prepare('SELECT * FROM assessments WHERE transfer_id = ?').get(id) as any

  const now = new Date()
  const deadline = transfer.deadline_at ? new Date(transfer.deadline_at) : null
  const isOverdue = deadline ? deadline < now : false
  const hoursLeft = deadline ? Math.max(0, (deadline.getTime() - now.getTime()) / 3600000) : null

  const flow = STATUS_FLOW[transfer.status]

  res.json({
    success: true,
    data: {
      ...transfer,
      timeline,
      assessment: assessment || null,
      nextAction: flow?.label || '',
      nextResponsible: flow?.responsible || '',
      isOverdue,
      hoursLeft: hoursLeft !== null ? Math.round(hoursLeft * 10) / 10 : null,
    },
  })
})

router.patch('/:id/status', (req: Request, res: Response): void => {
  const db = getDb()
  const id = Number(req.params.id)
  const { action, remark } = req.body
  const operator = (req as any).decodedName || req.headers['x-user-name'] as string || '未知'
  const operatorRole = (req as any).decodedRole || req.headers['x-user-role'] as string || '未知'

  const transfer = db.prepare('SELECT * FROM transfers WHERE id = ?').get(id) as any
  if (!transfer) {
    res.status(404).json({ success: false, error: '记录不存在' })
    return
  }

  const p = (n: number) => String(n).padStart(2, '0')
  const nowStr = () => {
    const d = new Date()
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
  }

  if (action === 'confirm' && transfer.status === 'pending_transfer') {
    const sla = getSlaHours('transferred')
    const deadlineAt = new Date(Date.now() + sla * 3600000)
    const deadlineStr = `${deadlineAt.getFullYear()}-${p(deadlineAt.getMonth() + 1)}-${p(deadlineAt.getDate())} ${p(deadlineAt.getHours())}:${p(deadlineAt.getMinutes())}`

    db.prepare("UPDATE transfers SET status = 'transferred', confirmed_at = datetime('now','localtime'), updated_at = datetime('now','localtime'), deadline_at = ? WHERE id = ?").run(deadlineStr, id)
    db.prepare('INSERT INTO operation_logs (transfer_id, operator, operator_role, action, detail, remark) VALUES (?, ?, ?, \'confirm\', ?, ?)').run(id, operator, operatorRole, `确认转栏 ${transfer.ear_tag}`, remark || '')
  } else if (action === 'submit' && transfer.status === 'transferred') {
    const sla = getSlaHours('pending_assessment')
    const deadlineAt = new Date(Date.now() + sla * 3600000)
    const deadlineStr = `${deadlineAt.getFullYear()}-${p(deadlineAt.getMonth() + 1)}-${p(deadlineAt.getDate())} ${p(deadlineAt.getHours())}:${p(deadlineAt.getMinutes())}`

    db.prepare("UPDATE transfers SET status = 'pending_assessment', submitted_at = datetime('now','localtime'), updated_at = datetime('now','localtime'), deadline_at = ? WHERE id = ?").run(deadlineStr, id)

    db.prepare(`
      INSERT INTO assessments (transfer_id, ear_tag, breed, age_days, from_pen, to_pen, status, created_at, updated_at, deadline_at)
      VALUES (?, ?, ?, ?, ?, ?, 'pending_assessment', datetime('now','localtime'), datetime('now','localtime'), ?)
    `).run(id, transfer.ear_tag, transfer.breed, transfer.age_days, transfer.from_pen, transfer.to_pen, deadlineStr)

    const assessment = db.prepare('SELECT * FROM assessments WHERE transfer_id = ? ORDER BY id DESC LIMIT 1').get(id) as any

    db.prepare('INSERT INTO operation_logs (transfer_id, assessment_id, operator, operator_role, action, detail, remark) VALUES (?, ?, ?, ?, \'submit\', ?, ?)').run(id, assessment.id, operator, operatorRole, `提交评估申请 ${transfer.ear_tag}`, remark || '')
  } else {
    res.status(400).json({ success: false, error: `无法在状态 ${transfer.status} 下执行 ${action}` })
    return
  }

  const updated = db.prepare('SELECT * FROM transfers WHERE id = ?').get(id)
  res.json({ success: true, data: updated })
})

router.post('/:transferId/assessments', (req: Request, res: Response): void => {
  const db = getDb()
  const transferId = Number(req.params.transferId)
  const { healthScore, cullRecommend, remark } = req.body
  const vetName = (req as any).decodedName || req.headers['x-user-name'] as string || '未知'

  const transfer = db.prepare('SELECT * FROM transfers WHERE id = ?').get(transferId) as any
  if (!transfer) {
    res.status(404).json({ success: false, error: '转栏记录不存在' })
    return
  }

  const assessment = db.prepare('SELECT * FROM assessments WHERE transfer_id = ? ORDER BY id DESC LIMIT 1').get(transferId) as any
  if (!assessment) {
    res.status(404).json({ success: false, error: '评估记录不存在' })
    return
  }

  if (assessment.status !== 'pending_assessment') {
    res.status(400).json({ success: false, error: '当前状态不允许评估' })
    return
  }

  const p = (n: number) => String(n).padStart(2, '0')
  const sla = getSlaHours('pending_approval')
  const deadlineAt = new Date(Date.now() + sla * 3600000)
  const deadlineStr = `${deadlineAt.getFullYear()}-${p(deadlineAt.getMonth() + 1)}-${p(deadlineAt.getDate())} ${p(deadlineAt.getHours())}:${p(deadlineAt.getMinutes())}`

  db.prepare(`
    UPDATE assessments SET
      health_score = ?,
      cull_recommend = ?,
      vet_name = ?,
      vet_remark = ?,
      assessed_at = datetime('now','localtime'),
      status = 'pending_approval',
      updated_at = datetime('now','localtime'),
      deadline_at = ?
    WHERE id = ?
  `).run(healthScore, cullRecommend ? 1 : 0, vetName, remark || '', deadlineStr, assessment.id)

  db.prepare(`
    UPDATE transfers SET
      status = 'pending_approval',
      updated_at = datetime('now','localtime'),
      deadline_at = ?
    WHERE id = ?
  `).run(deadlineStr, transferId)

  db.prepare('INSERT INTO operation_logs (transfer_id, assessment_id, operator, operator_role, action, detail, remark) VALUES (?, ?, ?, ?, \'assess\', ?, ?)').run(
    transferId,
    assessment.id,
    vetName,
    '兽医',
    `完成评估 ${transfer.ear_tag}，健康评分${healthScore}，${cullRecommend ? '建议淘汰' : '建议留养'}`,
    remark || '',
  )

  const updated = db.prepare('SELECT * FROM assessments WHERE id = ?').get(assessment.id)
  res.json({ success: true, data: updated })
})

export default router
