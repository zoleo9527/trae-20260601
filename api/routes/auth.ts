import { Router, type Request, type Response } from 'express'
import db from '../db.js'

const router = Router()

router.post('/login', (req: Request, res: Response): void => {
  const { username, password } = req.body
  if (!username || !password) {
    res.status(400).json({ success: false, error: '请输入用户名和密码' })
    return
  }

  const user = db
    .prepare('SELECT id, username, name, role FROM users WHERE username = ? AND password = ?')
    .get(username, password) as { id: number; username: string; name: string; role: string } | undefined

  if (!user) {
    res.status(401).json({ success: false, error: '用户名或密码错误' })
    return
  }

  res.json({
    success: true,
    data: {
      token: String(user.id),
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
      },
    },
  })
})

export default router
