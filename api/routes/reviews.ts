import { Router, type Request, type Response } from 'express'
import { getReviews, approveReview, rejectReview } from '../services/reviewService.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  try {
    const filters = {
      status: req.query.status as string | undefined,
      reviewerId: req.query.reviewerId ? Number(req.query.reviewerId) : undefined,
    }
    const data = getReviews(filters)
    res.json({ success: true, data })
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message })
  }
})

router.post('/:id/approve', (req: Request, res: Response): void => {
  try {
    const id = Number(req.params.id)
    const { reviewerId, reviewerRole } = req.body
    const data = approveReview(id, reviewerId, reviewerRole)
    res.json({ success: true, data })
  } catch (e: any) {
    res.status(400).json({ success: false, error: e.message })
  }
})

router.post('/:id/reject', (req: Request, res: Response): void => {
  try {
    const id = Number(req.params.id)
    const { reviewerId, reviewerRole, reason } = req.body
    const data = rejectReview(id, reviewerId, reviewerRole, reason)
    res.json({ success: true, data })
  } catch (e: any) {
    res.status(400).json({ success: false, error: e.message })
  }
})

export default router
