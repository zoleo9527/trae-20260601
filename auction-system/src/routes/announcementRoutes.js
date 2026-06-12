const express = require('express');
const router = express.Router();
const announcementController = require('../controllers/announcementController');
const { authenticate, requireProjectManager, requireReviewer, requireAdmin } = require('../middleware/auth');

router.post('/', authenticate, requireProjectManager, announcementController.createAnnouncement);
router.put('/:id/submit', authenticate, requireProjectManager, announcementController.submitForReview);
router.put('/:id/review', authenticate, requireReviewer, announcementController.reviewAnnouncement);
router.put('/:id/publish', authenticate, requireProjectManager, announcementController.publishAnnouncement);
router.get('/:id', authenticate, announcementController.getAnnouncementById);
router.get('/', authenticate, announcementController.getAllAnnouncements);
router.put('/:id', authenticate, requireProjectManager, announcementController.updateAnnouncement);
router.delete('/:id', authenticate, requireProjectManager, announcementController.deleteAnnouncement);
router.get('/:id/history', authenticate, announcementController.getAnnouncementStatusHistory);
router.get('/stats/pending-review', authenticate, requireReviewer, announcementController.getPendingReviewCount);

module.exports = router;