const express = require('express');
const router = express.Router();
const { upload, uploadAttachment, getAttachments, getAttachmentById, deleteAttachment, downloadAttachment } = require('../controllers/attachmentController');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.post('/', authenticate, upload.single('file'), uploadAttachment);
router.get('/', authenticate, getAttachments);
router.get('/:id', authenticate, getAttachmentById);
router.delete('/:id', authenticate, requireAdmin, deleteAttachment);
router.get('/:id/download', authenticate, downloadAttachment);

module.exports = router;