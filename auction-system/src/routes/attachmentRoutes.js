const express = require('express');
const router = express.Router();
const attachmentController = require('../controllers/attachmentController');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.post('/', authenticate, attachmentController.upload.single('file'), attachmentController.uploadAttachment);
router.get('/', authenticate, attachmentController.getAttachments);
router.get('/:id', authenticate, attachmentController.getAttachmentById);
router.delete('/:id', authenticate, requireAdmin, attachmentController.deleteAttachment);
router.get('/:id/download', authenticate, attachmentController.downloadAttachment);

module.exports = router;