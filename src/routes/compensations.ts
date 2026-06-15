import { Router } from 'express';
import CompensationController from '../controllers/CompensationController';
import { authenticate, requireRole } from '../middleware/auth';
import Role from '../models/Role';

const router = Router();

router.post('/', authenticate, requireRole([Role.STORE_MANAGER, Role.ADMIN]), CompensationController.create);
router.get('/:id', authenticate, CompensationController.getById);
router.get('/claim/:claimId', authenticate, CompensationController.getByClaimId);
router.put('/:id', authenticate, requireRole([Role.STORE_MANAGER, Role.ADMIN]), CompensationController.update);

router.post('/:id/approve', authenticate, requireRole([Role.STORE_MANAGER, Role.ADMIN]), CompensationController.approve);
router.post('/:id/pay', authenticate, requireRole([Role.STORE_MANAGER, Role.ADMIN]), CompensationController.pay);
router.post('/:id/complete', authenticate, requireRole([Role.STORE_MANAGER, Role.ADMIN]), CompensationController.complete);
router.post('/:id/cancel', authenticate, requireRole([Role.STORE_MANAGER, Role.ADMIN]), CompensationController.cancel);

router.get('/pending/list', authenticate, requireRole([Role.STORE_MANAGER, Role.ADMIN]), CompensationController.listPending);

export default router;