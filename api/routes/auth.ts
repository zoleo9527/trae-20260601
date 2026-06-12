import { Router } from 'express'
import { asyncHandler } from '../middleware/errorHandler.js'
import * as AuthController from '../controllers/AuthController.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

router.post('/login', asyncHandler(AuthController.login))
router.post('/logout', asyncHandler(authenticate), asyncHandler(AuthController.logout))
router.get('/me', asyncHandler(authenticate), asyncHandler(AuthController.getCurrentUser))
router.post('/register', asyncHandler(AuthController.register))
router.post('/change-password', asyncHandler(authenticate), asyncHandler(AuthController.changePassword))

export default router