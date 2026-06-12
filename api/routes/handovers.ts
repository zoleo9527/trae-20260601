import { Router } from 'express'
import { asyncHandler } from '../middleware/errorHandler.js'
import * as HandoverController from '../controllers/HandoverController.js'
import { authenticate, requireSupervisor } from '../middleware/auth.js'

const router = Router()

router.get('/', asyncHandler(authenticate), asyncHandler(HandoverController.getHandoversWithFilter))
router.get('/all', asyncHandler(authenticate), asyncHandler(HandoverController.getAllHandovers))
router.get('/:id', asyncHandler(authenticate), asyncHandler(HandoverController.getHandoverById))
router.post('/', asyncHandler(authenticate), asyncHandler(HandoverController.createHandover))
router.put('/:id', asyncHandler(authenticate), asyncHandler(HandoverController.updateHandover))
router.put('/:id/approve', asyncHandler(authenticate), requireSupervisor, asyncHandler(HandoverController.approveHandover))
router.put('/:id/reject', asyncHandler(authenticate), requireSupervisor, asyncHandler(HandoverController.rejectHandover))
router.delete('/:id', asyncHandler(authenticate), asyncHandler(HandoverController.deleteHandover))

export default router