import { Router, type Request, type Response } from 'express'
import { seed } from '../seed.js'

const router = Router()

router.post('/', (req: Request, res: Response): void => {
  try {
    seed()
    res.json({ success: true, data: { message: '数据已重置' } })
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) })
  }
})

export default router
