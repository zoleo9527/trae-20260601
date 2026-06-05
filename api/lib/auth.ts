import type { NextFunction, Request, Response } from 'express'
import { randomUUID } from 'node:crypto'
import prisma from './prisma.js'

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        username: string
        role: string
        displayName: string
      }
    }
  }
}

const sessions = new Map<string, { userId: string; expires: number }>()

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }
    const session = sessions.get(token)
    if (!session || session.expires < Date.now()) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, username: true, role: true, displayName: true },
    })
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }
    req.user = user
    next()
  } catch (error) {
    next(error)
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Forbidden' })
      return
    }
    next()
  }
}

export function createSession(userId: string): string {
  const token = randomUUID()
  sessions.set(token, { userId, expires: Date.now() + 24 * 60 * 60 * 1000 })
  return token
}

export function destroySession(token: string) {
  sessions.delete(token)
}
