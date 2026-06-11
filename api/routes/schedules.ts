import { Router, type Request, type Response } from 'express'
import { getSchedules, createSchedule, submitSchedule, updateSchedule } from '../services/scheduleService.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  try {
    const filters = {
      counterId: req.query.counterId ? Number(req.query.counterId) : undefined,
      weekStart: req.query.weekStart as string | undefined,
      status: req.query.status as string | undefined,
    }
    const data = getSchedules(filters)
    res.json({ success: true, data })
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message })
  }
})

router.post('/', (req: Request, res: Response): void => {
  try {
    const data = createSchedule(req.body)
    res.json({ success: true, data })
  } catch (e: any) {
    res.status(400).json({ success: false, error: e.message })
  }
})

router.post('/:id/submit', (req: Request, res: Response): void => {
  try {
    const id = Number(req.params.id)
    const { operatorId } = req.body
    const data = submitSchedule(id, operatorId)
    res.json({ success: true, data })
  } catch (e: any) {
    res.status(400).json({ success: false, error: e.message })
  }
})

router.put('/:id', (req: Request, res: Response): void => {
  try {
    const id = Number(req.params.id)
    const data = updateSchedule(id, req.body)
    res.json({ success: true, data })
  } catch (e: any) {
    res.status(400).json({ success: false, error: e.message })
  }
})

export default router
