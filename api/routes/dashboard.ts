import { Router, type Request, type Response } from 'express'
import db from '../db.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  const { role } = req.query
  if (!role) {
    res.status(400).json({ error: 'role为必填参数' })
    return
  }

  let todoCount: Record<string, number> = {}

  if (role === 'nurse') {
    const cnt = (db.prepare("SELECT COUNT(*) as cnt FROM contracts WHERE status = 'pending_review'").get() as { cnt: number }).cnt
    todoCount = { pending_review: cnt }
  } else if (role === 'public_health') {
    const pending = (db.prepare("SELECT COUNT(*) as cnt FROM archives WHERE status = 'pending'").get() as { cnt: number }).cnt
    const processing = (db.prepare("SELECT COUNT(*) as cnt FROM archives WHERE status = 'processing'").get() as { cnt: number }).cnt
    todoCount = { pending, processing }
  } else if (role === 'doctor') {
    const cnt = (db.prepare("SELECT COUNT(*) as cnt FROM contracts WHERE status = 'returned'").get() as { cnt: number }).cnt
    todoCount = { returned: cnt }
  }

  const recentNotifications = db.prepare(`
    SELECT n.*, c.resident_name, c.contract_no, a.archive_no
    FROM notifications n
    LEFT JOIN contracts c ON n.contract_id = c.id
    LEFT JOIN archives a ON n.archive_id = a.id
    WHERE n.target_role = ? AND n.is_read = 0
    ORDER BY n.created_at DESC
    LIMIT 5
  `).all(role)

  const totalContracts = (db.prepare('SELECT COUNT(*) as cnt FROM contracts').get() as { cnt: number }).cnt
  const totalArchives = (db.prepare('SELECT COUNT(*) as cnt FROM archives').get() as { cnt: number }).cnt
  const completedArchives = (db.prepare("SELECT COUNT(*) as cnt FROM archives WHERE status = 'completed'").get() as { cnt: number }).cnt
  const completionRate = totalArchives > 0 ? Math.round((completedArchives / totalArchives) * 100) : 0

  res.json({
    todoCount,
    recentNotifications,
    stats: {
      totalContracts,
      totalArchives,
      completionRate
    }
  })
})

export default router
