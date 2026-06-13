import express from 'express'
import { getJobs, getJobById, createJob, updateJob, auditJob, publishJob } from '../controllers/jobController.js'
import { authMiddleware, roleMiddleware } from '../middleware/authMiddleware.js'

const router = express.Router()

router.get('/', authMiddleware, getJobs)
router.get('/:id', authMiddleware, getJobById)
router.post('/', authMiddleware, roleMiddleware(['hr']), createJob)
router.put('/:id', authMiddleware, roleMiddleware(['hr']), updateJob)
router.post('/:id/audit', authMiddleware, roleMiddleware(['operator']), auditJob)
router.post('/:id/publish', authMiddleware, roleMiddleware(['consultant']), publishJob)

export default router