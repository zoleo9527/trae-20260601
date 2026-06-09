import { Router, type Request, type Response } from 'express'
import db from '../db.js'

const router = Router()

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 10)
}

router.get('/', (req: Request, res: Response): void => {
  const { userId } = req.query
  if (!userId) {
    res.status(400).json({ error: 'userId为必填参数' })
    return
  }

  const rows = db.prepare(`
    SELECT r.*, c.resident_name, c.contract_no, c.status
    FROM recent_items r
    JOIN contracts c ON r.item_id = c.id
    WHERE r.user_id = ?
    ORDER BY r.accessed_at DESC
    LIMIT 10
  `).all(userId)

  res.json(rows)
})

router.post('/', (req: Request, res: Response): void => {
  const { userId, itemType, itemId } = req.body
  if (!userId || !itemType || !itemId) {
    res.status(400).json({ error: 'userId、itemType、itemId为必填项' })
    return
  }

  const now = new Date().toISOString()
  const existing = db.prepare(
    'SELECT * FROM recent_items WHERE user_id = ? AND item_type = ? AND item_id = ?'
  ).get(userId, itemType, itemId) as Record<string, unknown> | undefined

  if (existing) {
    db.prepare('UPDATE recent_items SET accessed_at = ? WHERE id = ?').run(now, existing.id)
  } else {
    const id = genId()
    db.prepare(`
      INSERT INTO recent_items (id, user_id, item_type, item_id, accessed_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, userId, itemType, itemId, now)
  }

  const item = db.prepare(`
    SELECT r.*, c.resident_name, c.contract_no, c.status
    FROM recent_items r
    JOIN contracts c ON r.item_id = c.id
    WHERE r.user_id = ? AND r.item_type = ? AND r.item_id = ?
  `).get(userId, itemType, itemId)

  res.json(item)
})

export default router
