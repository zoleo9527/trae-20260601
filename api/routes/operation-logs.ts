import { Router, type Request, type Response } from 'express'
import db from '../db.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  try {
    const { module, operator, dateFrom, dateTo } = req.query

    const page = Math.max(1, Number(req.query.page) || 1)
    const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 20))
    const offset = (page - 1) * pageSize

    let countSql = 'SELECT COUNT(*) as total FROM operation_logs WHERE 1=1'
    let sql = 'SELECT * FROM operation_logs WHERE 1=1'
    const params: unknown[] = []

    if (module) {
      countSql += ' AND module = ?'
      sql += ' AND module = ?'
      params.push(module)
    }
    if (operator) {
      countSql += ' AND operator LIKE ?'
      sql += ' AND operator LIKE ?'
      params.push(`%${operator}%`)
    }
    if (dateFrom) {
      countSql += ' AND created_at >= ?'
      sql += ' AND created_at >= ?'
      params.push(dateFrom)
    }
    if (dateTo) {
      countSql += ' AND created_at <= ?'
      sql += ' AND created_at <= ?'
      params.push(dateTo)
    }

    const { total } = db.prepare(countSql).get(...params) as { total: number }

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
    const rows = db.prepare(sql).all(...params, pageSize, offset)

    res.json({
      success: true,
      data: {
        items: rows,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) })
  }
})

export default router
