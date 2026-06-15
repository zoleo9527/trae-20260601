const express = require('express');
const RecordService = require('../services/recordService');
const AuthService = require('../services/authService');

const router = express.Router();

router.get('/', (req, res) => {
  const operatorId = req.headers['x-user-id'];
  AuthService.requireUser(operatorId);

  const filters = {};
  if (req.query.projectId) filters.projectId = req.query.projectId;
  if (req.query.operator) filters.operator = req.query.operator;
  if (req.query.type) filters.type = req.query.type;
  if (req.query.startTime) filters.startTime = req.query.startTime;
  if (req.query.endTime) filters.endTime = req.query.endTime;

  const records = RecordService.listAll(filters);
  res.json({
    success: true,
    data: records,
    total: records.length
  });
});

router.get('/project/:projectId', (req, res) => {
  const operatorId = req.headers['x-user-id'];
  AuthService.requireUser(operatorId);

  const records = RecordService.listByProject(req.params.projectId);
  res.json({
    success: true,
    data: records,
    total: records.length
  });
});

router.get('/timeline/:projectId', (req, res) => {
  const operatorId = req.headers['x-user-id'];
  AuthService.requireUser(operatorId);

  const timeline = RecordService.getTimeline(req.params.projectId);
  res.json({
    success: true,
    data: timeline
  });
});

module.exports = router;
