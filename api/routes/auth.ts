import { Router, type Request, type Response } from 'express'
import { getDb } from '../db/init.js'
import { generateToken, authMiddleware } from '../middleware/auth.js'

const router = Router()

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { username, password } = req.body

  if (!username || !password) {
    res.status(400).json({ success: false, error: '请输入用户名和密码' })
    return
  }

  const db = getDb()
  const user = db.prepare('SELECT * FROM users WHERE username = ? AND password = ?').get(username, password) as any

  if (!user) {
    res.status(401).json({ success: false, error: '用户名或密码错误' })
    return
  }

  const token = generateToken({ userId: user.id, role: user.role })

  res.json({
    success: true,
    data: {
      token,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
      },
    },
  })
})

router.get('/me', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  const user = (req as any).user
  if (!user) {
    res.status(401).json({ success: false, error: '未认证' })
    return
  }

  const db = getDb()
  const dbUser = db.prepare('SELECT id, name, role, username FROM users WHERE id = ?').get(user.userId) as any

  if (!dbUser) {
    res.status(404).json({ success: false, error: '用户不存在' })
    return
  }

  res.json({
    success: true,
    data: {
      id: dbUser.id,
      name: dbUser.name,
      role: dbUser.role,
      username: dbUser.username,
    },
  })
})

export default router
