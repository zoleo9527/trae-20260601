import { Router } from 'express'
import { asyncHandler } from '../middleware/errorHandler.js'
import * as CustomerController from '../controllers/CustomerController.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

router.get('/', asyncHandler(authenticate), asyncHandler(CustomerController.getCustomersWithFilter))
router.get('/all', asyncHandler(authenticate), asyncHandler(CustomerController.getAllCustomers))
router.get('/:id', asyncHandler(authenticate), asyncHandler(CustomerController.getCustomerById))
router.post('/', asyncHandler(authenticate), asyncHandler(CustomerController.createCustomer))
router.put('/:id', asyncHandler(authenticate), asyncHandler(CustomerController.updateCustomer))
router.delete('/:id', asyncHandler(authenticate), asyncHandler(CustomerController.deleteCustomer))
router.get('/:id/handovers', asyncHandler(authenticate), asyncHandler(CustomerController.getCustomerHandovers))

export default router