import express from 'express'
import { getInterviews, createInterview, updateInterviewStatus } from '../controllers/interviewController.js'
import { authMiddleware, roleMiddleware } from '../middleware/authMiddleware.js'

const router = express.Router()

router.get('/', authMiddleware, getInterviews)
router.post('/', authMiddleware, roleMiddleware(['consultant']), createInterview)
router.put('/:id/status', authMiddleware, roleMiddleware(['consultant']), updateInterviewStatus)

export default router