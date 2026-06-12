const express = require('express');
const router = express.Router();
const { createAnnouncement, submitForReview, reviewAnnouncement, publishAnnouncement, getAnnouncementById, getAllAnnouncements, updateAnnouncement, deleteAnnouncement, getAnnouncementStatusHistory, getPendingReviewCount } = require('../controllers/announcementController');
const { authenticate, requireProjectManager, requireReviewer, requireAdmin } = require('../middleware/auth');

router.post('/', authenticate, requireProjectManager, createAnnouncement);
router.put('/:id/submit', authenticate, requireProjectManager, submitForReview);
router.put('/:id/review', authenticate, requireReviewer, reviewAnnouncement);
router.put('/:id/publish', authenticate, requireProjectManager, publishAnnouncement);
router.get('/:id', authenticate, getAnnouncementById);
router.get('/', authenticate, getAllAnnouncements);
router.put('/:id', authenticate, requireProjectManager, updateAnnouncement);
router.delete('/:id', authenticate, requireProjectManager, deleteAnnouncement);
router.get('/:id/history', authenticate, getAnnouncementStatusHistory);
router.get('/stats/pending-review', authenticate, requireReviewer, getPendingReviewCount);

module.exports = router;