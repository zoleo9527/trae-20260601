import { NextFunction, Request, Response } from 'express'
import { getDb } from './db'
import { Role } from './types'

declare global {
  namespace Express {
    interface Request {
      currentUser?: {
        id: number
        name: string
        role: Role
        enterprise_id: number | null
      }
    }
  }
}

export function auth(requiredRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const userId = Number(req.headers['x-user-id'])
    if (!userId) {
      res.status(401).json({ error: '缺少 x-user-id 请求头' })
      return
    }

    const db = getDb()
    const user = db.prepare('SELECT id, name, role, enterprise_id FROM users WHERE id = ?').get(userId) as any
    if (!user) {
      res.status(401).json({ error: '用户不存在' })
      return
    }

    if (!requiredRoles.includes(user.role)) {
      res.status(403).json({ error: `角色 ${user.role} 无权访问此接口，需要: ${requiredRoles.join('/')}` })
      return
    }

    req.currentUser = user
    next()
  }
}
