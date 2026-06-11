import { Router, type Request, type Response } from 'express'
import { getLogs } from '../services/logService.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  try {
    const filters = {
      operatorId: req.query.operatorId ? Number(req.query.operatorId) : undefined,
      entityType: req.query.entityType as string | undefined,
      dateRange: req.query.startDate && req.query.endDate
        ? { start: req.query.startDate as string, end: req.query.endDate as string }
        : undefined,
    }
    const data = getLogs(filters)
    res.json({ success: true, data })
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message })
  }
})

export default router
