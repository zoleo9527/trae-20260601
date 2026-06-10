import { type Request, type Response, type NextFunction } from 'express'
import db from '../db.js'

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number
        username: string
        name: string
        role: string
      }
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: '未登录' })
    return
  }

  const userId = authHeader.slice(7)
  const user = db.prepare('SELECT id, username, name, role FROM users WHERE id = ?').get(userId) as
    | { id: number; username: string; name: string; role: string }
    | undefined

  if (!user) {
    res.status(401).json({ success: false, error: '用户不存在' })
    return
  }

  req.user = user
  next()
}
