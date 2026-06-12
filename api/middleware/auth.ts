import { type Request, type Response, type NextFunction } from 'express'
import * as AuthService from '../services/AuthService.js'
import { UserRole, JwtPayload } from '../types/types.js'

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload
    }
  }
}

export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: 'No token provided'
    })
    return
  }

  const token = authHeader.split(' ')[1]
  const payload = await AuthService.verifyToken(token)

  if (!payload) {
    res.status(401).json({
      success: false,
      error: 'Invalid or expired token'
    })
    return
  }

  req.user = payload
  next()
}

export function requireRole(roles: UserRole[]): (req: Request, res: Response, next: NextFunction) => void {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized'
      })
      return
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      })
      return
    }

    next()
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  requireRole([UserRole.ADMIN])(req, res, next)
}

export function requireSupervisor(req: Request, res: Response, next: NextFunction): void {
  requireRole([UserRole.ADMIN, UserRole.SUPERVISOR])(req, res, next)
}

export function requireManager(req: Request, res: Response, next: NextFunction): void {
  requireRole([UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.MANAGER])(req, res, next)
}

export async function optionalAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next()
    return
  }

  const token = authHeader.split(' ')[1]
  const payload = await AuthService.verifyToken(token)

  if (payload) {
    req.user = payload
  }

  next()
}