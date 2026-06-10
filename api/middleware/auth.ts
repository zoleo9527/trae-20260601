import jwt from 'jsonwebtoken'
import type { Request, Response, NextFunction } from 'express'

export interface AuthPayload {
  id: number
  username: string
  name: string
  role: string
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) {
    res.status(401).json({ success: false, error: '未提供认证令牌' })
    return
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as AuthPayload
    req.user = decoded
    next()
  } catch {
    res.status(401).json({ success: false, error: '认证令牌无效' })
  }
}
