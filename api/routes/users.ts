import { Router } from 'express'
import { asyncHandler } from '../middleware/errorHandler.js'
import * as UserController from '../controllers/UserController.js'
import { authenticate, requireAdmin } from '../middleware/auth.js'

const router = Router()

router.get('/', asyncHandler(authenticate), requireAdmin, asyncHandler(UserController.getAllUsers))
router.get('/active', asyncHandler(authenticate), asyncHandler(UserController.getActiveUsers))
router.get('/handoverable', asyncHandler(authenticate), asyncHandler(UserController.getHandoverableUsers))
router.get('/role/:role', asyncHandler(authenticate), asyncHandler(UserController.getUsersByRole))
router.get('/:id', asyncHandler(authenticate), requireAdmin, asyncHandler(UserController.getUserById))
router.post('/', asyncHandler(authenticate), requireAdmin, asyncHandler(UserController.createUser))
router.put('/:id', asyncHandler(authenticate), requireAdmin, asyncHandler(UserController.updateUser))
router.delete('/:id', asyncHandler(authenticate), requireAdmin, asyncHandler(UserController.deleteUser))

export default router