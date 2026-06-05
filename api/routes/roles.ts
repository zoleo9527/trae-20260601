import { Router, type Request, type Response } from 'express'

const ROLES = [
  { id: 'rental', name: '装备租赁员', key: 'rental' },
  { id: 'coach_supervisor', name: '教练主管', key: 'coach_supervisor' },
  { id: 'safety_patrol', name: '安全巡逻员', key: 'safety_patrol' },
]

const router = Router()

router.get('/', (_req: Request, res: Response): void => {
  res.json({ success: true, data: ROLES })
})

router.post('/switch', (req: Request, res: Response): void => {
  const { roleId } = req.body
  if (!roleId) {
    res.status(400).json({ success: false, error: 'roleId is required' })
    return
  }

  const role = ROLES.find((r) => r.id === roleId)
  if (!role) {
    res.status(404).json({ success: false, error: 'Role not found' })
    return
  }

  res.json({ success: true, data: role })
})

export default router
