import { Router } from 'express'
import { z } from 'zod'
import { authenticateToken, requireRole } from '../middleware/auth'
import { register, login, getUserById, getAllUsers, updateUser, deleteUser } from '../services/authService'
import { UserRole } from '@prisma/client'

const router = Router()

const registerSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6),
  realName: z.string().min(1),
  role: z.enum(['PROJECT_MANAGER', 'REVIEWER', 'FINANCIAL', 'ADMIN']),
  phone: z.string().optional(),
  email: z.string().email().optional()
})

router.post('/register', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const validatedData = registerSchema.parse(req.body)
    const user = await register(
      validatedData.username,
      validatedData.password,
      validatedData.realName,
      validatedData.role as UserRole,
      validatedData.phone,
      validatedData.email
    )
    res.status(201).json({ id: user.id, username: user.username, realName: user.realName, role: user.role })
  } catch (error: any) {
    res.status(400).json({ error: error.message })
  }
})

const loginSchema = z.object({
  username: z.string(),
  password: z.string()
})

router.post('/login', async (req, res) => {
  try {
    const validatedData = loginSchema.parse(req.body)
    const { user, token } = await login(validatedData.username, validatedData.password)
    res.json({
      token,
      user: { id: user.id, username: user.username, realName: user.realName, role: user.role }
    })
  } catch (error: any) {
    res.status(401).json({ error: error.message })
  }
})

router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await getUserById(req.user!.userId)
    if (!user) {
      return res.status(404).json({ error: '用户不存在' })
    }
    res.json({ id: user.id, username: user.username, realName: user.realName, role: user.role, phone: user.phone, email: user.email })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/users', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const users = await getAllUsers()
    res.json(users)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

router.put('/users/:id', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { id } = req.params
    const { realName, phone, email } = req.body
    const user = await updateUser(id, { realName, phone, email })
    res.json({ id: user.id, username: user.username, realName: user.realName, role: user.role, phone: user.phone, email: user.email })
  } catch (error: any) {
    res.status(400).json({ error: error.message })
  }
})

router.delete('/users/:id', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { id } = req.params
    await deleteUser(id)
    res.status(204).send()
  } catch (error: any) {
    res.status(400).json({ error: error.message })
  }
})

export default router