import { Router, type Request, type Response } from 'express'
import { getDb } from '../db.js'

const router = Router()

router.get('/', (_req: Request, res: Response): void => {
  const db = getDb()
  const { type, isRead } = _req.query as { type?: string; isRead?: string }

  let sql = 'SELECT * FROM notifications WHERE 1=1'
  const params: any[] = []

  if (type) {
    sql += ' AND type = ?'
    params.push(type)
  }
  if (isRead !== undefined) {
    sql += ' AND is_read = ?'
    params.push(isRead === '1' ? 1 : 0)
  }

  sql += ' ORDER BY created_at DESC'

  const rows = db.prepare(sql).all(...params)
  const unreadCount = (db.prepare('SELECT COUNT(*) as c FROM notifications WHERE is_read = 0').get() as any).c

  res.json({ success: true, data: rows, unreadCount })
})

router.patch('/:id/read', (req: Request, res: Response): void => {
  const db = getDb()
  const existing = db.prepare('SELECT * FROM notifications WHERE id = ?').get(req.params.id) as any
  if (!existing) {
    res.status(404).json({ success: false, error: 'Notification not found' })
    return
  }

  db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(req.params.id)
  res.json({ success: true, data: { ...existing, is_read: 1 } })
})

router.post('/read-all', (_req: Request, res: Response): void => {
  const db = getDb()
  db.prepare('UPDATE notifications SET is_read = 1 WHERE is_read = 0').run()
  res.json({ success: true })
})

export default router
