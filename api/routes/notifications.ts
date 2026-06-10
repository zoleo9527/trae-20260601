import { Router, type Request, type Response } from 'express'
import db from '../db.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  const userId = req.user?.id
  if (!userId) {
    res.status(401).json({ success: false, error: '未登录' })
    return
  }

  const notifications = db.prepare(
    'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC'
  ).all(userId)

  res.json({ success: true, data: notifications })
})

router.patch('/read-all', (req: Request, res: Response): void => {
  const userId = req.user?.id
  if (!userId) {
    res.status(401).json({ success: false, error: '未登录' })
    return
  }

  db.prepare('UPDATE notifications SET read = 1 WHERE user_id = ?').run(userId)

  res.json({ success: true })
})

router.patch('/:id/read', (req: Request, res: Response): void => {
  const notification = db.prepare('SELECT * FROM notifications WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined
  if (!notification) {
    res.status(404).json({ success: false, error: '通知不存在' })
    return
  }

  db.prepare('UPDATE notifications SET read = 1 WHERE id = ?').run(req.params.id)

  res.json({ success: true, data: { id: Number(req.params.id) } })
})

export default router
