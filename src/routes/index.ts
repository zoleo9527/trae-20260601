import { Router, IRouter } from 'express';
import { authMiddleware, requireRoles } from '../middleware/auth';
import { UserRole } from '../types';
import * as authController from '../controllers/authController';
import * as exceptionController from '../controllers/exceptionController';
import * as refundController from '../controllers/refundController';

const router: IRouter = Router();

router.get('/auth/me', authMiddleware, authController.getCurrentUser);

router.get('/exceptions/statistics', authMiddleware, exceptionController.getStatistics);
router.post('/exceptions', authMiddleware, requireRoles(UserRole.SCHEDULE_MANAGER, UserRole.DUTY_MANAGER), exceptionController.createException);
router.get('/exceptions', authMiddleware, exceptionController.getExceptionList);
router.get('/exceptions/:id', authMiddleware, exceptionController.getExceptionDetail);
router.put('/exceptions/:id/status', authMiddleware, requireRoles(UserRole.SCHEDULE_MANAGER, UserRole.DUTY_MANAGER), exceptionController.updateStatus);
router.post('/exceptions/:id/hall-change', authMiddleware, requireRoles(UserRole.SCHEDULE_MANAGER, UserRole.DUTY_MANAGER), exceptionController.processHallChange);
router.post('/exceptions/:id/initiate-refund', authMiddleware, requireRoles(UserRole.DUTY_MANAGER), exceptionController.initiateRefund);
router.post('/exceptions/:id/close', authMiddleware, requireRoles(UserRole.DUTY_MANAGER), exceptionController.closeException);

router.get('/refunds/statistics', authMiddleware, refundController.getStatistics);
router.get('/refunds/review', authMiddleware, requireRoles(UserRole.TICKET_SUPERVISOR, UserRole.DUTY_MANAGER), refundController.getReviewList);
router.post('/refunds', authMiddleware, requireRoles(UserRole.TICKET_SUPERVISOR, UserRole.DUTY_MANAGER), refundController.createRefund);
router.get('/refunds', authMiddleware, refundController.getRefundList);
router.get('/refunds/:id', authMiddleware, refundController.getRefundDetail);
router.post('/refunds/:id/approve', authMiddleware, requireRoles(UserRole.TICKET_SUPERVISOR, UserRole.DUTY_MANAGER), refundController.approveRefund);
router.post('/refunds/:id/reject', authMiddleware, requireRoles(UserRole.TICKET_SUPERVISOR, UserRole.DUTY_MANAGER), refundController.rejectRefund);
router.post('/refunds/:id/process', authMiddleware, requireRoles(UserRole.TICKET_SUPERVISOR, UserRole.DUTY_MANAGER), refundController.processRefund);
router.get('/refunds/by-exception/:exceptionId', authMiddleware, refundController.getRefundsByExceptionId);

export default router;
