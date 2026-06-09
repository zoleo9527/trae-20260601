import { Router, type Response } from 'express'
import { getDb } from '../database.js'
import { authMiddleware, generateToken, type AuthRequest } from '../middleware/auth.js'

const router = Router()

router.post('/login', (req: AuthRequest, res: Response): void => {
  const { username, password } = req.body
  if (!username || !password) {
    res.status(400).json({ success: false, error: '用户名和密码不能为空' })
    return
  }

  const db = getDb()
  const user = db.prepare('SELECT * FROM users WHERE username = ? AND password = ?').get(username, password) as any
  if (!user) {
    res.status(401).json({ success: false, error: '用户名或密码错误' })
    return
  }

  const token = generateToken({ id: user.id, username: user.username, role: user.role, name: user.name })

  db.prepare('INSERT INTO operation_logs (user_id, username, role, action, detail) VALUES (?, ?, ?, ?, ?)').run(
    user.id, user.username, user.role, 'login', '用户登录'
  )

  res.json({ success: true, data: { token, role: user.role, name: user.name } })
})

router.get('/me', authMiddleware, (req: AuthRequest, res: Response): void => {
  res.json({ success: true, data: req.user })
})

export default router
