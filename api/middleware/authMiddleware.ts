import express, { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { db, User } from '../database/db.js'

const JWT_SECRET = process.env.JWT_SECRET || 'secret_key'

export interface AuthRequest extends Request {
  user?: User
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1]
  
  if (!token) {
    return res.status(401).json({ success: false, message: 'Unauthorized' })
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ success: false, message: 'Invalid token' })
    }

    const userId = decoded as { id: number }
    const user = db.users.findById(userId.id)
    
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' })
    }
    
    req.user = user
    next()
  })
}

export const roleMiddleware = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden' })
    }
    next()
  }
}