const express = require('express');
const router = express.Router();
const feeService = require('../services/feeService');
const inspectionService = require('../services/inspectionService');

router.get('/overdue-fees', (req, res) => {
  try {
    const result = feeService.listFeeItems(req.query);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/fee-dispute', (req, res) => {
  try {
    const { feeId, reason, handler } = req.body;
    const result = feeService.createDispute(feeId, reason, handler);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.put('/fee-dispute/:id', (req, res) => {
  try {
    const result = feeService.resolveDispute(Number(req.params.id), req.body.result);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.get('/inspection-plans', (req, res) => {
  try {
    const result = inspectionService.listInspectionPlans(req.query);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/notify-inspection/:id', (req, res) => {
  try {
    const result = inspectionService.notifyInspection(Number(req.params.id), req.body.notifiedTo);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.get('/missed-notifications', (req, res) => {
  try {
    const result = inspectionService.getMissedNotifications();
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
