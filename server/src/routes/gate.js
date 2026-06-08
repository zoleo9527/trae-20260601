const express = require('express');
const router = express.Router();
const containerService = require('../services/containerService');

router.post('/entry', (req, res) => {
  try {
    const result = containerService.registerEntry(req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.put('/entry/:id', (req, res) => {
  try {
    const result = containerService.modifyEntry(
      Number(req.params.id), req.body, req.body.operator || ''
    );
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.get('/entries', (req, res) => {
  try {
    const result = containerService.listEntries(req.query);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/entry/:id', (req, res) => {
  try {
    const result = containerService.getEntry(Number(req.params.id));
    if (!result) return res.status(404).json({ success: false, error: '记录不存在' });
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
