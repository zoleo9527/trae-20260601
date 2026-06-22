import { Router, type Request, type Response } from 'express'
import crypto from 'crypto'
import { getDb } from '../db.js'
import type { Role } from '../types.js'

const router = Router()

let currentRole: Role = 'pm'
const roleNames: Record<Role, string> = { pm: '\u9879\u76EE\u7ECF\u7406', captain: '\u65BD\u5DE5\u961F\u957F', engineer: '\u552E\u540E\u5DE5\u7A0B\u5E08' }

export function getRoleInfo(): { role: Role; name: string } {
  return { role: currentRole, name: roleNames[currentRole] }
}

router.post('/', (req: Request, res: Response): void => {
  const { role } = req.body
  if (!role || !['pm', 'captain', 'engineer'].includes(role)) {
    res.status(400).json({ success: false, error: '\u65E0\u6548\u7684\u89D2\u8272' })
    return
  }
  currentRole = role as Role
  res.json({ success: true, data: { role: currentRole, name: roleNames[currentRole] } })
})

router.get('/', (_req: Request, res: Response): void => {
  res.json({ success: true, data: { role: currentRole, name: roleNames[currentRole] } })
})

export default router
