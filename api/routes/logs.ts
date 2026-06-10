import { Router, type Request, type Response } from 'express'
import { getDb } from '../db.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  const db = getDb()
  const { role, action, dateFrom, dateTo, page = '1', pageSize = '15' } = req.query

  let sql = 'SELECT * FROM operation_logs WHERE 1=1'
  const params: any[] = []

  if (role) {
    sql += ' AND operator_role = ?'
    params.push(role)
  }
  if (action) {
    sql += ' AND action = ?'
    params.push(action)
  }
  if (dateFrom) {
    sql += ' AND created_at >= ?'
    params.push(`${dateFrom} 00:00`)
  }
  if (dateTo) {
    sql += ' AND created_at <= ?'
    params.push(`${dateTo} 23:59`)
  }

  const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as total')
  const total = (db.prepare(countSql).get(...params) as { total: number }).total

  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
  const p = Number(page)
  const ps = Number(pageSize)
  params.push(ps, (p - 1) * ps)

  const list = db.prepare(sql).all(...params)

  res.json({ success: true, data: { list, total, page: p, pageSize: ps } })
})

export default router
