import express from 'express'
import { resetData } from '../controllers/resetController.js'
import { authMiddleware, roleMiddleware } from '../middleware/authMiddleware.js'

const router = express.Router()

router.post('/', authMiddleware, roleMiddleware(['operator']), resetData)

export default router