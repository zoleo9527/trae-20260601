import bcrypt from 'bcryptjs'
import { Router, type Request, type Response } from 'express'
import { authenticate, createSession, destroySession } from '../lib/auth.js'
import prisma from '../lib/prisma.js'

const router = Router()

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body
    if (!username || !password) {
      res.status(400).json({ error: 'Missing username or password' })
      return
    }

    const user = await prisma.user.findUnique({ where: { username } })
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' })
      return
    }

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      res.status(401).json({ error: 'Invalid credentials' })
      return
    }

    const token = createSession(user.id)
    res.json({
      token,
      user: { id: user.id, username: user.username, role: user.role, displayName: user.displayName },
    })
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/me', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { id: true, username: true, role: true, displayName: true },
    })
    if (!user) {
      res.status(404).json({ error: 'User not found' })
      return
    }
    res.json(user)
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/logout', async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (token) destroySession(token)
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
