import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'mother-baby-coupon-secret-key-2024'

export interface AuthRequest extends Request {
  user?: {
    id: number
    username: string
    name: string
    role: string
    store_id: number | null
  }
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'AUTH_002',
        message: '未授权访问',
      },
    })
  }

  const token = authHeader.substring(7)

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any
    req.user = decoded
    next()
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'AUTH_002',
        message: 'Token已过期',
      },
    })
  }
}

export function roleMiddleware(...allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_002',
          message: '未授权访问',
        },
      })
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'AUTH_003',
          message: '无权限访问',
        },
      })
    }

    next()
  }
}

export { JWT_SECRET }
