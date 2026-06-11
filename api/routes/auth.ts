import { Router, type Request, type Response } from 'express'
import db from '../db.js'

const router = Router()

router.post('/demo-login', (req: Request, res: Response): void => {
  const { role } = req.body
  if (!role) {
    res.status(400).json({ success: false, error: '缺少 role 参数' })
    return
  }

  const staff = db.prepare('SELECT id, name, role, counterId, avatar FROM staff WHERE role = ? LIMIT 1').get(role) as any
  if (!staff) {
    res.status(404).json({ success: false, error: '未找到该角色的演示账号' })
    return
  }

  res.json({ success: true, data: staff })
})

export default router
