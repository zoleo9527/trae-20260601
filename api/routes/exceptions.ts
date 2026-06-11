import { Router, type Request, type Response } from 'express'
import { getExceptions, getExceptionStats } from '../services/exceptionService.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  try {
    const filters = {
      type: req.query.type as string | undefined,
      counterId: req.query.counterId ? Number(req.query.counterId) : undefined,
    }
    const data = getExceptions(filters)
    res.json({ success: true, data })
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message })
  }
})

router.get('/stats', (req: Request, res: Response): void => {
  try {
    const data = getExceptionStats()
    res.json({ success: true, data })
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message })
  }
})

export default router
