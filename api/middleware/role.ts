import { type Request, type Response, type NextFunction } from 'express'

export function roleMiddleware(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: '未认证' })
      return
    }
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ success: false, error: '权限不足' })
      return
    }
    next()
  }
}
