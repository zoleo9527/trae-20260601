import { Router } from 'express'
import * as StatisticsController from '../controllers/StatisticsController.js'
import { authenticate } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/errorHandler.js'

const router = Router()

router.get('/dashboard', asyncHandler(authenticate), asyncHandler(StatisticsController.getDashboardStats))
router.get('/handover-rate', asyncHandler(authenticate), asyncHandler(StatisticsController.getHandoverRate))
router.get('/renewal-rate', asyncHandler(authenticate), asyncHandler(StatisticsController.getRenewalRate))

export default router