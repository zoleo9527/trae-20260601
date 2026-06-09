import { Router, type Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import db from '../db.js'
import { verifyToken, type RequestWithUser } from '../middleware/auth.js'

const router = Router()

const JWT_SECRET = process.env.JWT_SECRET || 'express-return-review-secret'

router.post('/login', (req: RequestWithUser, res: Response): void => {
  const { username, password } = req.body

  if (!username || !password) {
    res.status(400).json({ success: false, error: '请提供用户名和密码' })
    return
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as {
    id: number
    username: string
    password: string
    role: string
    display_name: string
  } | undefined

  if (!user) {
    res.status(401).json({ success: false, error: '用户名或密码错误' })
    return
  }

  const isPasswordValid = bcrypt.compareSync(password, user.password)
  if (!isPasswordValid) {
    res.status(401).json({ success: false, error: '用户名或密码错误' })
    return
  }

  const token = jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role,
      displayName: user.display_name,
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  )

  res.status(200).json({
    success: true,
    data: {
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        displayName: user.display_name,
      },
    },
  })
})

router.get('/me', verifyToken, (req: RequestWithUser, res: Response): void => {
  res.status(200).json({
    success: true,
    data: {
      id: req.user.id,
      username: req.user.username,
      role: req.user.role,
      displayName: req.user.displayName,
    },
  })
})

export default router
