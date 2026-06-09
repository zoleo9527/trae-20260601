import { type Request, type Response, type NextFunction } from 'express'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'express-return-review-secret'

export interface RequestWithUser extends Request {
  user: {
    id: number
    username: string
    role: string
    displayName: string
  }
}

export function verifyToken(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: '未提供认证令牌' })
    return
  }

  const token = authHeader.slice(7)
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: number
      username: string
      role: string
      displayName: string
    }
    ;(req as RequestWithUser).user = decoded
    next()
  } catch {
    res.status(401).json({ success: false, error: '认证令牌无效或已过期' })
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as RequestWithUser).user
    if (!user) {
      res.status(401).json({ success: false, error: '未认证' })
      return
    }
    if (!roles.includes(user.role)) {
      res.status(403).json({ success: false, error: '无权限执行此操作' })
      return
    }
    next()
  }
}
