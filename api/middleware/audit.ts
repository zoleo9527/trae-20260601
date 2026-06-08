import { type Request, type Response, type NextFunction } from 'express'
import db from '../db.js'

type DetailFn = (req: Request) => string

export function auditMiddleware(actionType: string, detailFn?: DetailFn) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const originalEnd = res.end
    res.end = function (this: Response, ...args: any[]) {
      if (req.user && res.statusCode < 400) {
        try {
          const detail = detailFn ? detailFn(req) : `${req.method} ${req.originalUrl}`
          db.prepare(
            'INSERT INTO audit_logs (operator_id, action_type, detail, ip) VALUES (?, ?, ?, ?)'
          ).run(req.user.id, actionType, detail, req.ip || null)
        } catch {}
      }
      return originalEnd.apply(this, args)
    }
    next()
  }
}
