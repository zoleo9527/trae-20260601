const express = require('express');
const router = express.Router();
const slotService = require('../services/slotService');

router.get('/slots', (req, res) => {
  try {
    const result = slotService.getSlotAllocations(req.query.block, req.query.bay);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/allocate', (req, res) => {
  try {
    const { containerId, preferredSlot, allocatedBy } = req.body;
    const result = slotService.allocateSlot(containerId, preferredSlot, allocatedBy);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.put('/reallocate/:id', (req, res) => {
  try {
    const containerId = Number(req.params.id);
    const { newSlotId, reason, allocatedBy } = req.body;
    const result = slotService.reallocateContainer(containerId, newSlotId, reason, allocatedBy);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.get('/allocation-history/:containerNo', (req, res) => {
  try {
    const result = slotService.getAllocationHistory(req.params.containerNo);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/misplaced', (req, res) => {
  try {
    const result = slotService.getMisplacedContainers();
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/fix-misplaced/:id', (req, res) => {
  try {
    const allocationId = Number(req.params.id);
    const { newSlotId, allocatedBy } = req.body;
    const result = slotService.fixMisplaced(allocationId, newSlotId, allocatedBy);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

module.exports = router;
