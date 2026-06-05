const express = require('express');
const AuditService = require('../services/auditService');

const router = express.Router();

router.get('/', async (req, res) => {
  const limit = req.query.limit ? Number(req.query.limit) : 20;
  const logs = await AuditService.getRecent(limit);
  res.json({ data: logs });
});

router.get('/booking/:bookingId', async (req, res) => {
  const logs = await AuditService.getByBookingId(Number(req.params.bookingId));
  res.json({ data: logs });
});

module.exports = router;
