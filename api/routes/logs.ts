import { Router, type Response } from 'express'
import { getDb } from '../database.js'
import { authMiddleware, type AuthRequest } from '../middleware/auth.js'

const router = Router()

router.use(authMiddleware)

router.get('/', (req: AuthRequest, res: Response): void => {
  const db = getDb()
  const { containerNo, role, action, startTime, endTime, page = '1', size = '20' } = req.query
  const pageNum = Number(page) || 1
  const sizeNum = Number(size) || 20
  const offset = (pageNum - 1) * sizeNum

  let where = '1=1'
  const params: any[] = []

  if (containerNo) {
    where += ' AND container_no LIKE ?'
    params.push(`%${containerNo}%`)
  }
  if (role) {
    where += ' AND role = ?'
    params.push(role)
  }
  if (action) {
    where += ' AND action = ?'
    params.push(action)
  }
  if (startTime) {
    where += ' AND created_at >= ?'
    params.push(startTime)
  }
  if (endTime) {
    where += ' AND created_at <= ?'
    params.push(endTime)
  }

  const total = (db.prepare(`SELECT COUNT(*) as count FROM operation_logs WHERE ${where}`).get(...params) as any).count
  const rows = db.prepare(`SELECT * FROM operation_logs WHERE ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(...params, sizeNum, offset)

  res.json({ success: true, data: { list: rows, total, page: pageNum, size: sizeNum } })
})

export default router
