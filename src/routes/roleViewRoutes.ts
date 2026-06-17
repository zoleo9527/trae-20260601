import express from 'express'
import { getRoleView, UserRole } from '../services/roleViewService'

const router = express.Router()

router.get('/owner', async (req, res) => {
  try {
    const result = await getRoleView('OWNER')
    res.json(result)
  } catch (error) {
    res.status(500).json({ error: (error as Error).message })
  }
})

router.get('/chef', async (req, res) => {
  try {
    const result = await getRoleView('CHEF')
    res.json(result)
  } catch (error) {
    res.status(500).json({ error: (error as Error).message })
  }
})

router.get('/housekeeper', async (req, res) => {
  try {
    const result = await getRoleView('HOUSEKEEPER')
    res.json(result)
  } catch (error) {
    res.status(500).json({ error: (error as Error).message })
  }
})

router.get('/admin', async (req, res) => {
  try {
    const result = await getRoleView('ADMIN')
    res.json(result)
  } catch (error) {
    res.status(500).json({ error: (error as Error).message })
  }
})

router.get('/:role', async (req, res) => {
  try {
    const { role } = req.params
    const validRoles: UserRole[] = ['OWNER', 'CHEF', 'HOUSEKEEPER', 'ADMIN']
    
    if (!validRoles.includes(role as UserRole)) {
      return res.status(400).json({ error: '无效的角色类型' })
    }

    const result = await getRoleView(role as UserRole)
    res.json(result)
  } catch (error) {
    res.status(500).json({ error: (error as Error).message })
  }
})

export default router