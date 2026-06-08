import { Router, type Request, type Response } from 'express'
import db from '../db.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

router.use(authMiddleware)

router.get('/', (req: Request, res: Response): void => {
  const { floor, status } = req.query
  let sql = `
    SELECT r.*, u.name as assignee_name
    FROM rooms r
    LEFT JOIN users u ON r.current_assignee_id = u.id
    WHERE 1=1
  `
  const params: any[] = []

  if (floor) {
    sql += ' AND r.floor = ?'
    params.push(Number(floor))
  }
  if (status) {
    sql += ' AND r.status = ?'
    params.push(status)
  }

  sql += ' ORDER BY r.floor, r.room_number'

  const rooms = db.prepare(sql).all(...params)
  res.json({ success: true, data: rooms })
})

router.get('/:id', (req: Request, res: Response): void => {
  const roomId = Number(req.params.id)

  const room = db.prepare(`
    SELECT r.*, u.name as assignee_name
    FROM rooms r
    LEFT JOIN users u ON r.current_assignee_id = u.id
    WHERE r.id = ?
  `).get(roomId)

  if (!room) {
    res.status(404).json({ success: false, error: '房间不存在' })
    return
  }

  const repairs = db.prepare(`
    SELECT ro.*, u1.name as creator_name, u2.name as assignee_name
    FROM repair_orders ro
    LEFT JOIN users u1 ON ro.created_by = u1.id
    LEFT JOIN users u2 ON ro.assigned_to = u2.id
    WHERE ro.room_id = ?
    ORDER BY ro.created_at DESC
    LIMIT 10
  `).all(roomId)

  const recoveries = db.prepare(`
    SELECT rf.*, u1.name as cleaner_name, u2.name as supervisor_name
    FROM recovery_flows rf
    LEFT JOIN users u1 ON rf.cleaner_id = u1.id
    LEFT JOIN users u2 ON rf.supervisor_id = u2.id
    WHERE rf.room_id = ?
    ORDER BY rf.created_at DESC
    LIMIT 10
  `).all(roomId)

  res.json({
    success: true,
    data: { room, repairs, recoveries },
  })
})

export default router
