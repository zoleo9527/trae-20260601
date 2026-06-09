import { Router, type Response } from 'express'
import db from '../db.js'
import { verifyToken, type RequestWithUser } from '../middleware/auth.js'

const router = Router()

router.use(verifyToken)

router.get('/', (req: RequestWithUser, res: Response): void => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1)
  const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string) || 20))
  const keyword = req.query.keyword as string | undefined
  const returnStatus = req.query.returnStatus as string | undefined
  const offset = (page - 1) * pageSize

  let whereClauses: string[] = []
  let params: any[] = []

  if (keyword) {
    whereClauses.push('(r.tracking_no LIKE ? OR rv.conclusion LIKE ?)')
    params.push(`%${keyword}%`, `%${keyword}%`)
  }

  if (returnStatus) {
    whereClauses.push('r.status = ?')
    params.push(returnStatus)
  }

  if (req.user.role === '客服') {
    whereClauses.push('r.created_by = ?')
    params.push(req.user.id)
  } else if (req.user.role === '派件员') {
    whereClauses.push('(r.assigned_to = ? OR r.status = ?)')
    params.push(req.user.id, '待派件员确认')
  }

  const whereStr = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : ''

  const countRow = db.prepare(
    `SELECT COUNT(*) as total FROM reviews rv LEFT JOIN returns r ON rv.return_id = r.id ${whereStr}`
  ).get(...params) as { total: number }

  const list = db.prepare(
    `SELECT rv.*, r.tracking_no, r.reason, r.status as return_status
     FROM reviews rv
     LEFT JOIN returns r ON rv.return_id = r.id
     ${whereStr}
     ORDER BY rv.created_at DESC
     LIMIT ? OFFSET ?`
  ).all(...params, pageSize, offset) as any[]

  res.status(200).json({
    success: true,
    data: {
      list: list.map(item => ({
        id: item.id,
        returnId: item.return_id,
        trackingNo: item.tracking_no,
        reason: item.reason,
        returnStatus: item.return_status,
        conclusion: item.conclusion,
        improvement: item.improvement,
        operatorId: item.operator_id,
        operatorRole: item.operator_role,
        operatorName: item.operator_name,
        createdAt: item.created_at,
      })),
      total: countRow.total,
      page,
      pageSize,
    },
  })
})

export default router
