import { Router, type Request, type Response } from 'express'
import { seedData } from '../data/repository.js'

const router = Router()

router.post('/', (_req: Request, res: Response): void => {
  seedData()
  res.json({ success: true, message: '数据已重置' })
})

export default router
