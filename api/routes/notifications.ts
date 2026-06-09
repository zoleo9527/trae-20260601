import { Router, type Request, type Response } from 'express'
import db from '../db.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  const { targetRole } = req.query
  if (!targetRole) {
    res.status(400).json({ error: 'targetRole为必填参数' })
    return
  }

  const rows = db.prepare(`
    SELECT n.*, c.resident_name, c.contract_no, a.archive_no
    FROM notifications n
    LEFT JOIN contracts c ON n.contract_id = c.id
    LEFT JOIN archives a ON n.archive_id = a.id
    WHERE n.target_role = ?
    ORDER BY n.created_at DESC
  `).all(targetRole)

  res.json(rows)
})

router.post('/:id/read', (req: Request, res: Response): void => {
  const notification = db.prepare('SELECT * FROM notifications WHERE id = ?').get(req.params.id)
  if (!notification) {
    res.status(404).json({ error: '通知未找到' })
    return
  }

  db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(req.params.id)
  const updated = db.prepare('SELECT * FROM notifications WHERE id = ?').get(req.params.id)
  res.json(updated)
})

export default router
