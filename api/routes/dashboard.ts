import { Router, type Request, type Response } from 'express'
import db from '../db.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

router.use(authMiddleware)

router.get('/', (req: Request, res: Response): void => {
  const pendingRepairs = db.prepare(`
    SELECT COUNT(*) as count FROM repair_orders WHERE status IN ('pending', 'in_progress')
  `).get() as { count: number }

  const urgentRepairs = db.prepare(`
    SELECT ro.*, r.room_number, u.name as assignee_name
    FROM repair_orders ro
    JOIN rooms r ON ro.room_id = r.id
    LEFT JOIN users u ON ro.assigned_to = u.id
    WHERE ro.urgency IN ('high', 'urgent') AND ro.status IN ('pending', 'in_progress')
    ORDER BY ro.created_at DESC
  `).all()

  const blockedRooms = db.prepare(`
    SELECT r.*, u.name as assignee_name
    FROM rooms r
    LEFT JOIN users u ON r.current_assignee_id = u.id
    WHERE r.status IN ('repair', 'cleaning', 'pending_inspect')
    ORDER BY r.floor, r.room_number
  `).all()

  const recentActivities = db.prepare(`
    SELECT al.*, u.name as operator_name
    FROM audit_logs al
    LEFT JOIN users u ON al.operator_id = u.id
    ORDER BY al.created_at DESC
    LIMIT 20
  `).all()

  res.json({
    success: true,
    data: {
      pending_repairs: pendingRepairs.count,
      urgent_repairs: urgentRepairs,
      blocked_rooms: blockedRooms,
      recent_activities: recentActivities,
    },
  })
})

export default router
