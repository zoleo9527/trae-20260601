import { Router, type Request, type Response } from 'express'
import db from '../db.js'

const router = Router()

router.post('/demo-login', (req: Request, res: Response): void => {
  const { role, staffId } = req.body
  let staff: any

  if (staffId) {
    staff = db.prepare('SELECT id, name, role, counterId, brandId, avatar FROM staff WHERE id = ?').get(Number(staffId))
  } else if (role) {
    staff = db.prepare('SELECT id, name, role, counterId, brandId, avatar FROM staff WHERE role = ? ORDER BY id LIMIT 1').get(role)
  }

  if (!staff) {
    res.status(404).json({ success: false, error: '未找到匹配的演示账号' })
    return
  }

  res.json({ success: true, data: staff })
})

router.get('/demo-accounts', (_req: Request, res: Response): void => {
  const accounts = db.prepare(`
    SELECT s.id, s.name, s.role, s.counterId, s.brandId, s.avatar, c.name AS counterName
    FROM staff s
    LEFT JOIN counters c ON s.counterId = c.id
    ORDER BY CASE s.role
      WHEN 'counter_manager' THEN 1
      WHEN 'floor_supervisor' THEN 2
      WHEN 'brand_supervisor' THEN 3
      WHEN 'guide' THEN 4
      ELSE 5 END, s.id
  `).all()
  res.json({ success: true, data: accounts })
})

export default router
