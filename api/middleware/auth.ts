import jwt from 'jsonwebtoken'
import { type Request, type Response, type NextFunction } from 'express'

const JWT_SECRET = 'hotel-secret-2024'

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number
        name: string
        role: string
      }
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: '未提供认证令牌' })
    return
  }

  const token = authHeader.substring(7)
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: number
      name: string
      role: string
    }
    req.user = {
      id: decoded.id,
      name: decoded.name,
      role: decoded.role,
    }
    next()
  } catch {
    res.status(401).json({ success: false, error: '令牌无效或已过期' })
  }
}

export { JWT_SECRET }
