import { Router, type Request, type Response } from 'express'
import { getRoleInfo } from '../data/repository.js'
import type { Role } from '../../shared/types.js'

const router = Router()

router.post('/', (req: Request, res: Response): void => {
  const { role } = req.body
  if (!role || !['invigilator', 'admin', 'tech'].includes(role)) {
    res.status(400).json({ error: '无效角色' })
    return
  }
  const info = getRoleInfo(role as Role)
  res.json(info)
})

export default router
