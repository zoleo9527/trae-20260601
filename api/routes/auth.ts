import { Router, type Request, type Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import db from '../db.js'
import { JWT_SECRET } from '../middleware/auth.js'

const router = Router()

router.post('/login', (req: Request, res: Response): void => {
  const { username, password } = req.body
  if (!username || !password) {
    res.status(400).json({ success: false, error: '用户名和密码不能为空' })
    return
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as {
    id: number
    username: string
    password_hash: string
    name: string
    role: string
  } | undefined

  if (!user) {
    res.status(401).json({ success: false, error: '用户名或密码错误' })
    return
  }

  const valid = bcrypt.compareSync(password, user.password_hash)
  if (!valid) {
    res.status(401).json({ success: false, error: '用户名或密码错误' })
    return
  }

  const token = jwt.sign(
    { id: user.id, name: user.name, role: user.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  )

  res.json({
    success: true,
    data: {
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
      },
    },
  })
})

export default router
