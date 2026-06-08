import { Router, type Request, type Response } from 'express'
import db from '../database.js'

const router = Router()

router.post('/register', async (req: Request, res: Response): Promise<void> => {
  // TODO: Implement register logic
})

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { username, password } = req.body

  if (!username || !password) {
    res.status(400).json({ success: false, error: 'username and password are required' })
    return
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any

  if (!user) {
    res.status(401).json({ success: false, error: 'Invalid username or password' })
    return
  }

  if (user.password_hash !== password) {
    res.status(401).json({ success: false, error: 'Invalid username or password' })
    return
  }

  res.json({
    success: true,
    data: {
      token: 'demo-token-' + user.id,
      user,
    },
  })
})

router.post('/logout', async (req: Request, res: Response): Promise<void> => {
  // TODO: Implement logout logic
})

router.get('/users', (_req: Request, res: Response): void => {
  const users = db.prepare('SELECT id, username, name, role, floor, created_at FROM users ORDER BY role, floor').all()
  res.json({ success: true, data: users })
})

router.get('/me', (req: Request, res: Response): void => {
  const { userId } = req.query

  if (!userId) {
    res.status(400).json({ success: false, error: 'userId is required' })
    return
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId)

  if (!user) {
    res.status(404).json({ success: false, error: 'User not found' })
    return
  }

  res.json({ success: true, data: user })
})

export default router
