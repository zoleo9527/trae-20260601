import { Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { db, User } from '../database/db.js'

const JWT_SECRET = process.env.JWT_SECRET || 'secret_key'

export const login = (req: Request, res: Response) => {
  const { username, password, role } = req.body

  const user = db.users.findOne(username, password, role)

  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' })
  }

  const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '1h' })

  res.json({
    success: true,
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role
    }
  })
}

export const me = (req: Request & { user?: User }, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' })
  }
  
  res.json({
    success: true,
    user: {
      id: req.user.id,
      username: req.user.username,
      role: req.user.role
    }
  })
}