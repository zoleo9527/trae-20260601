const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const exportService = require('../services/exportService');

router.post('/create', (req, res) => {
  try {
    const { taskType, parameters, createdBy } = req.body;
    if (!taskType) return res.status(400).json({ success: false, error: 'taskType is required' });

    const result = exportService.createExportTask(taskType, parameters, createdBy);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/tasks', (req, res) => {
  try {
    const result = exportService.listExportTasks(req.query);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/download/:id', (req, res) => {
  try {
    const filePath = exportService.getExportFilePath(Number(req.params.id));
    const fileName = path.basename(filePath);

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (err) {
    res.status(404).json({ success: false, error: err.message });
  }
});

module.exports = router;
