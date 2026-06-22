import { Router, type Request, type Response } from 'express'
import type { GasRole } from '../types.js'

const router = Router()

let currentRole: GasRole = 'safety_inspector'
const roleNames: Record<GasRole, string> = {
  safety_inspector: '安检员',
  customer_service: '客服',
  repair_technician: '维修师傅',
}

export function getRoleInfo(): { role: GasRole; name: string } {
  return { role: currentRole, name: roleNames[currentRole] }
}

router.post('/', (req: Request, res: Response): void => {
  const { role } = req.body
  if (!role || !['safety_inspector', 'customer_service', 'repair_technician'].includes(role)) {
    res.status(400).json({ success: false, error: '无效的角色' })
    return
  }
  currentRole = role as GasRole
  res.json({ success: true, data: { role: currentRole, name: roleNames[currentRole] } })
})

router.get('/', (_req: Request, res: Response): void => {
  res.json({ success: true, data: { role: currentRole, name: roleNames[currentRole] } })
})

export default router
