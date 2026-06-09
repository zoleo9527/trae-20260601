import { Router, type Request, type Response } from 'express'
import type { Role, Session } from '../types.js'

const ROLE_NAMES: Record<Role, string> = {
  sales_clerk: '张三',
  warehouse: '孙八',
  after_sales: '赵六',
  director: '王五',
}

let currentSession: Session = { role: 'sales_clerk', name: '张三' }

const router = Router()

router.get('/', (_req: Request, res: Response): void => {
  res.json({ success: true, data: currentSession })
})

router.post('/', (req: Request, res: Response): void => {
  const { role } = req.body as { role: Role }
  if (!role || !ROLE_NAMES[role]) {
    res.status(400).json({ success: false, error: '无效的角色' })
    return
  }
  currentSession = { role, name: ROLE_NAMES[role] }
  res.json({ success: true, data: currentSession })
})

export function getSession(): Session {
  return currentSession
}

export default router
