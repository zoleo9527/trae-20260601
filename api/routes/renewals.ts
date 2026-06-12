import { Router } from 'express'
import * as RenewalController from '../controllers/RenewalController.js'
import { authenticate } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/errorHandler.js'

const router = Router()

router.get('/', asyncHandler(authenticate), asyncHandler(RenewalController.getAllFollowUps))
router.get('/alerts', asyncHandler(authenticate), asyncHandler(RenewalController.getAlertCustomers))
router.get('/risk-customers', asyncHandler(authenticate), asyncHandler(RenewalController.getRiskCustomers))
router.post('/:customerId/follow-ups', asyncHandler(authenticate), asyncHandler(RenewalController.createFollowUp))
router.put('/:customerId/status', asyncHandler(authenticate), asyncHandler(RenewalController.updateRenewalStatus))
router.get('/:customerId/follow-ups', asyncHandler(authenticate), asyncHandler(RenewalController.getFollowUpsByCustomer))

export default router