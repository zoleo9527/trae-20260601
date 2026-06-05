const express = require('express');
const FeeReviewService = require('../services/feeReviewService');
const validate = require('../middleware/validate');
const { feeApproveSchema, feeRejectSchema } = require('../validation/schemas');

const router = express.Router();

router.get('/pending', async (req, res) => {
  const pending = await FeeReviewService.listPending();
  res.json({ data: pending });
});

router.get('/booking/:bookingId', async (req, res) => {
  const review = await FeeReviewService.getByBookingId(Number(req.params.bookingId));
  res.json({ data: review });
});

router.post('/:bookingId/approve', validate(feeApproveSchema), async (req, res) => {
  const result = await FeeReviewService.approve(
    Number(req.params.bookingId),
    req.validatedBody,
    req.user.id,
    req.user.role
  );
  res.json({ data: result });
});

router.post('/:bookingId/reject', validate(feeRejectSchema), async (req, res) => {
  const { reason } = req.validatedBody;
  const result = await FeeReviewService.reject(
    Number(req.params.bookingId),
    reason,
    req.user.id,
    req.user.role
  );
  res.json({ data: result });
});

module.exports = router;
