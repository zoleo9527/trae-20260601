import { Router, type Request, type Response } from 'express'
import { getDb } from '../db.js'

const router = Router()

const TOKENS: Map<string, { userId: number; role: string }> = new Map()

function generateToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export function verifyToken(token: string): { userId: number; role: string } | null {
  return TOKENS.get(token) || null
}

router.post('/login', (req: Request, res: Response): void => {
  const { username, password } = req.body
  if (!username || !password) {
    res.status(400).json({ message: '用户名和密码不能为空' })
    return
  }

  const db = getDb()
  const user = db.prepare('SELECT * FROM users WHERE username = ? AND password_hash = ?').get(username, password) as any

  if (!user) {
    res.status(401).json({ message: '用户名或密码错误' })
    return
  }

  const token = generateToken()
  TOKENS.set(token, { userId: user.id, role: user.role })

  res.json({
    user: {
      id: user.id,
      username: user.username,
      displayName: user.display_name,
      role: user.role,
      roleLabel: user.role_label,
    },
    token,
  })
})

router.get('/me', (req: Request, res: Response): void => {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: '未登录' })
    return
  }

  const token = authHeader.slice(7)
  const info = verifyToken(token)
  if (!info) {
    res.status(401).json({ message: '登录已过期' })
    return
  }

  const db = getDb()
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(info.userId) as any

  if (!user) {
    res.status(401).json({ message: '用户不存在' })
    return
  }

  res.json({
    user: {
      id: user.id,
      username: user.username,
      displayName: user.display_name,
      role: user.role,
      roleLabel: user.role_label,
    },
  })
})

export default router
