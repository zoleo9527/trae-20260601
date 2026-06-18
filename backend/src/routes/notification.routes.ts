import { Router } from 'express';
import { getNotificationList, getUnreadCount, getNotificationById, markAsRead, batchMarkAsRead, executeAction } from '../controllers/notification.controller.js';

const router = Router();

router.get('/', getNotificationList);
router.get('/unread-count', getUnreadCount);
router.get('/:id', getNotificationById);
router.post('/:id/read', markAsRead);
router.post('/batch-read', batchMarkAsRead);
router.post('/:id/action', executeAction);

export { router as notificationRoutes };