import { Router, type Request, type Response } from 'express'
import { getDb, getSlaHours, STATUS_FLOW } from '../db.js'

const router = Router()

function getRole(req: Request): string {
  return (req as any).decodedRole || req.headers['x-user-role'] as string || ''
}

function getName(req: Request): string {
  return (req as any).decodedName || req.headers['x-user-name'] as string || '未知'
}

router.get('/', (req: Request, res: Response): void => {
  const db = getDb()
  const { status, search, page = '1', pageSize = '10' } = req.query

  let sql = 'SELECT * FROM assessments WHERE 1=1'
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

  const enriched = list.map(a => {
    const flow = STATUS_FLOW[a.status]
    const now = new Date()
    const deadline = a.deadline_at ? new Date(a.deadline_at) : null
    const isOverdue = deadline ? deadline < now : false
    const hoursLeft = deadline ? Math.max(0, (deadline.getTime() - now.getTime()) / 3600000) : null

    return {
      ...a,
      nextAction: flow?.label || '',
      nextResponsible: flow?.responsible || '',
      isOverdue,
      hoursLeft: hoursLeft !== null ? Math.round(hoursLeft * 10) / 10 : null,
    }
  })

  res.json({ success: true, data: { list: enriched, total, page: p, pageSize: ps } })
})

router.get('/:id', (req: Request, res: Response): void => {
  const db = getDb()
  const id = Number(req.params.id)

  const assessment = db.prepare('SELECT * FROM assessments WHERE id = ?').get(id) as any
  if (!assessment) {
    res.status(404).json({ success: false, error: '记录不存在' })
    return
  }

  const transfer = db.prepare('SELECT * FROM transfers WHERE id = ?').get(assessment.transfer_id) as any

  const timeline = db.prepare(
    'SELECT * FROM operation_logs WHERE transfer_id = ? ORDER BY created_at ASC'
  ).all(assessment.transfer_id) as any[]

  const now = new Date()
  const deadline = assessment.deadline_at ? new Date(assessment.deadline_at) : null
  const isOverdue = deadline ? deadline < now : false
  const hoursLeft = deadline ? Math.max(0, (deadline.getTime() - now.getTime()) / 3600000) : null

  const flow = STATUS_FLOW[assessment.status]

  res.json({
    success: true,
    data: {
      ...assessment,
      transfer: transfer || null,
      timeline,
      nextAction: flow?.label || '',
      nextResponsible: flow?.responsible || '',
      isOverdue,
      hoursLeft: hoursLeft !== null ? Math.round(hoursLeft * 10) / 10 : null,
    },
  })
})

router.patch('/:id/approve', (req: Request, res: Response): void => {
  const role = getRole(req)
  if (role !== '场长') {
    res.status(403).json({ success: false, error: '仅场长可审批淘汰决定' })
    return
  }

  const db = getDb()
  const id = Number(req.params.id)
  const { approved, remark } = req.body
  const approverName = getName(req)

  const assessment = db.prepare('SELECT * FROM assessments WHERE id = ?').get(id) as any
  if (!assessment) {
    res.status(404).json({ success: false, error: '评估记录不存在' })
    return
  }

  if (assessment.status !== 'pending_approval') {
    const flow = STATUS_FLOW[assessment.status]
    res.status(400).json({ success: false, error: `当前状态为"${flow?.label || assessment.status}"，无法审批，需在"待审批"状态下操作` })
    return
  }

  const finalStatus = approved ? (assessment.cull_recommend ? 'culled' : 'retained') : 'pending_assessment'
  const action = approved ? 'approve' : 'reject'

  if (approved) {
    db.prepare(`
      UPDATE assessments SET
        approver_name = ?,
        approval_remark = ?,
        approved_at = datetime('now','localtime'),
        status = ?,
        updated_at = datetime('now','localtime'),
        deadline_at = NULL
      WHERE id = ?
    `).run(approverName, remark || '', finalStatus, id)

    db.prepare(`
      UPDATE transfers SET
        status = ?,
        updated_at = datetime('now','localtime'),
        deadline_at = NULL
      WHERE id = ?
    `).run(finalStatus, assessment.transfer_id)
  } else {
    const p = (n: number) => String(n).padStart(2, '0')
    const sla = getSlaHours('pending_assessment')
    const deadlineAt = new Date(Date.now() + sla * 3600000)
    const deadlineStr = `${deadlineAt.getFullYear()}-${p(deadlineAt.getMonth() + 1)}-${p(deadlineAt.getDate())} ${p(deadlineAt.getHours())}:${p(deadlineAt.getMinutes())}`

    db.prepare(`
      UPDATE assessments SET
        approver_name = ?,
        approval_remark = ?,
        approved_at = datetime('now','localtime'),
        status = 'pending_assessment',
        updated_at = datetime('now','localtime'),
        deadline_at = ?,
        health_score = NULL,
        cull_recommend = 0,
        vet_name = NULL,
        vet_remark = '',
        assessed_at = NULL
      WHERE id = ?
    `).run(approverName, remark || '', deadlineStr, id)

    db.prepare(`
      UPDATE transfers SET
        status = 'pending_assessment',
        updated_at = datetime('now','localtime'),
        deadline_at = ?
      WHERE id = ?
    `).run(deadlineStr, assessment.transfer_id)
  }

  const transfer = db.prepare('SELECT * FROM transfers WHERE id = ?').get(assessment.transfer_id) as any

  db.prepare('INSERT INTO operation_logs (transfer_id, assessment_id, operator, operator_role, action, detail, remark) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
    assessment.transfer_id,
    id,
    approverName,
    '场长',
    action,
    `${action === 'approve' ? '审批通过' : '驳回评估'} ${transfer.ear_tag}`,
    remark || '',
  )

  const updated = db.prepare('SELECT * FROM assessments WHERE id = ?').get(id)
  res.json({ success: true, data: updated })
})

export default router
