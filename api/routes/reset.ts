import { Router, type Request, type Response } from 'express'
import { resetDatabase } from '../db.js'

const router = Router()

router.post('/', (_req: Request, res: Response) => {
  try {
    resetDatabase()
    res.json({ success: true, message: '数据已重置到初始状态' })
  } catch (err) {
    res.status(500).json({ success: false, error: '重置失败' })
  }
})

export default router
