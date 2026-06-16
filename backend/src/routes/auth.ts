import { Router, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import db from '../database.js'
import { authMiddleware, AuthRequest, JWT_SECRET } from '../middlewares/auth.js'

const router = Router()

router.post('/login', (req, res) => {
  const { username, password } = req.body

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_002',
        message: '用户名和密码不能为空',
      },
    })
  }

  const user = db.prepare(`
    SELECT u.*, s.name as store_name
    FROM users u
    LEFT JOIN stores s ON u.store_id = s.id
    WHERE u.username = ?
  `).get(username) as any

  if (!user) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'AUTH_001',
        message: '用户名或密码错误',
      },
    })
  }

  const isValidPassword = bcrypt.compareSync(password, user.password_hash)

  if (!isValidPassword) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'AUTH_001',
        message: '用户名或密码错误',
      },
    })
  }

  const token = jwt.sign(
    {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      store_id: user.store_id,
    },
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
        store_id: user.store_id,
        store_name: user.store_name,
      },
    },
  })
})

router.post('/logout', (req, res) => {
  res.json({
    success: true,
    message: '退出登录成功',
  })
})

router.get('/me', authMiddleware, (req: AuthRequest, res: Response) => {
  const user = db.prepare(`
    SELECT u.id, u.username, u.name, u.role, u.store_id, s.name as store_name
    FROM users u
    LEFT JOIN stores s ON u.store_id = s.id
    WHERE u.id = ?
  `).get(req.user!.id) as any

  res.json({
    success: true,
    data: user,
  })
})

export default router
