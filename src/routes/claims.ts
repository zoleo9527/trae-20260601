import { Router } from 'express';
import WarrantyClaimController from '../controllers/WarrantyClaimController';
import { authenticate, requireRole } from '../middleware/auth';
import Role from '../models/Role';

const router = Router();

router.post('/', authenticate, requireRole([Role.FRONT_DESK, Role.ADMIN]), WarrantyClaimController.create);
router.get('/', authenticate, WarrantyClaimController.list);
router.get('/dashboard', authenticate, WarrantyClaimController.getDashboard);
router.get('/:id', authenticate, WarrantyClaimController.getById);
router.put('/:id', authenticate, requireRole([Role.FRONT_DESK, Role.ADMIN]), WarrantyClaimController.update);
router.delete('/:id', authenticate, requireRole([Role.FRONT_DESK, Role.ADMIN]), WarrantyClaimController.delete);

router.post('/:id/technician-review', authenticate, requireRole([Role.TECHNICIAN, Role.ADMIN]), WarrantyClaimController.technicianReview);
router.post('/:id/manager-review', authenticate, requireRole([Role.STORE_MANAGER, Role.ADMIN]), WarrantyClaimController.managerReview);
router.post('/:id/start-compensation', authenticate, requireRole([Role.STORE_MANAGER, Role.ADMIN]), WarrantyClaimController.startCompensation);
router.post('/:id/complete', authenticate, requireRole([Role.STORE_MANAGER, Role.ADMIN]), WarrantyClaimController.complete);

export default router;