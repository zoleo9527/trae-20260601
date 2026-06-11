import { Router, type Request, type Response } from 'express'
import {
  getAttendanceList,
  approveAttendanceSubmitted,
  confirmAttendance,
  markException,
  submitMaterial,
  escalateTimeout,
  resubmitAfterReject,
} from '../services/attendanceService.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  try {
    const filters = {
      status: req.query.status as string | undefined,
      date: req.query.date as string | undefined,
      counterId: req.query.counterId ? Number(req.query.counterId) : undefined,
      staffId: req.query.staffId ? Number(req.query.staffId) : undefined,
    }
    const data = getAttendanceList(filters)
    res.json({ success: true, data })
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message })
  }
})

router.post('/:id/approve-submitted', (req: Request, res: Response): void => {
  try {
    const id = Number(req.params.id)
    const { operatorId } = req.body
    const data = approveAttendanceSubmitted(id, operatorId)
    res.json({ success: true, data })
  } catch (e: any) {
    res.status(400).json({ success: false, error: e.message })
  }
})

router.post('/:id/confirm', (req: Request, res: Response): void => {
  try {
    const id = Number(req.params.id)
    const { operatorId } = req.body
    const data = confirmAttendance(id, operatorId)
    res.json({ success: true, data })
  } catch (e: any) {
    res.status(400).json({ success: false, error: e.message })
  }
})

router.post('/:id/exception', (req: Request, res: Response): void => {
  try {
    const id = Number(req.params.id)
    const { operatorId, exceptionType, note } = req.body
    const data = markException(id, operatorId, exceptionType, note)
    res.json({ success: true, data })
  } catch (e: any) {
    res.status(400).json({ success: false, error: e.message })
  }
})

router.post('/:id/submit-material', (req: Request, res: Response): void => {
  try {
    const id = Number(req.params.id)
    const { operatorId } = req.body
    const data = submitMaterial(id, operatorId)
    res.json({ success: true, data })
  } catch (e: any) {
    res.status(400).json({ success: false, error: e.message })
  }
})

router.post('/:id/escalate-timeout', (req: Request, res: Response): void => {
  try {
    const id = Number(req.params.id)
    const { supervisorId } = req.body
    const data = escalateTimeout(id, supervisorId)
    res.json({ success: true, data })
  } catch (e: any) {
    res.status(400).json({ success: false, error: e.message })
  }
})

router.post('/:id/resubmit', (req: Request, res: Response): void => {
  try {
    const id = Number(req.params.id)
    const { operatorId } = req.body
    const data = resubmitAfterReject(id, operatorId)
    res.json({ success: true, data })
  } catch (e: any) {
    res.status(400).json({ success: false, error: e.message })
  }
})

export default router
