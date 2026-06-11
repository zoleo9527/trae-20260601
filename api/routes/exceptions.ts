import { Router, type Request, type Response } from 'express'
import { getExceptions, getExceptionStats, getAttendanceTrail } from '../services/exceptionService.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  try {
    const filters = {
      type: req.query.type as string | undefined,
      counterId: req.query.counterId ? Number(req.query.counterId) : undefined,
      staffId: req.query.staffId ? Number(req.query.staffId) : undefined,
      brandId: req.query.brandId ? Number(req.query.brandId) : undefined,
      role: req.query.role as string | undefined,
      userId: req.query.userId ? Number(req.query.userId) : undefined,
    }
    const data = getExceptions(filters)
    res.json({ success: true, data })
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message })
  }
})

router.get('/stats', (req: Request, res: Response): void => {
  try {
    const role = req.query.role as string | undefined
    const userId = req.query.userId ? Number(req.query.userId) : undefined
    const data = getExceptionStats(role, userId)
    res.json({ success: true, data })
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message })
  }
})

router.get('/trail/:attendanceId', (req: Request, res: Response): void => {
  try {
    const id = Number(req.params.attendanceId)
    const data = getAttendanceTrail(id)
    res.json({ success: true, data })
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message })
  }
})

export default router
