const express = require('express');
const ScheduleService = require('../services/scheduleService');
const AuthService = require('../services/authService');
const IdempotencyService = require('../services/idempotencyService');

const router = express.Router();

router.get('/', (req, res) => {
  const { store } = require('../data/store');
  let schedules = store.schedules;
  if (req.query.projectId) {
    schedules = ScheduleService.listByProject(req.query.projectId);
  }
  res.json({
    success: true,
    data: schedules,
    total: schedules.length
  });
});

router.get('/project/:projectId', (req, res) => {
  const schedules = ScheduleService.listByProject(req.params.projectId);
  res.json({
    success: true,
    data: schedules
  });
});

router.get('/history/:projectId', (req, res) => {
  const history = ScheduleService.getHistory(req.params.projectId);
  res.json({
    success: true,
    data: history
  });
});

router.get('/:scheduleId', (req, res) => {
  const detail = ScheduleService.getDetail(req.params.scheduleId);
  res.json({
    success: true,
    data: detail
  });
});

router.post('/submit/:projectId', (req, res) => {
  const idempotencyKey = req.headers['x-idempotency-key'];
  const operatorId = req.headers['x-user-id'];

  const result = IdempotencyService.wrap(idempotencyKey, () => {
    AuthService.requireUser(operatorId);
    const schedule = ScheduleService.submitSchedule(req.params.projectId, req.body, operatorId);
    return { schedule };
  });

  res.json({
    success: true,
    data: result.schedule,
    _idempotent: result._idempotent || false,
    _idempotentAt: result._idempotentAt || null
  });
});

router.post('/confirm/:scheduleId', (req, res) => {
  const idempotencyKey = req.headers['x-idempotency-key'];
  const operatorId = req.headers['x-user-id'];

  const result = IdempotencyService.wrap(idempotencyKey, () => {
    AuthService.requireUser(operatorId);
    const schedule = ScheduleService.confirmSchedule(req.params.scheduleId, req.body, operatorId);
    return { schedule };
  });

  res.json({
    success: true,
    data: result.schedule,
    _idempotent: result._idempotent || false,
    _idempotentAt: result._idempotentAt || null
  });
});

router.post('/:scheduleId/remarks', (req, res) => {
  const operatorId = req.headers['x-user-id'];
  AuthService.requireUser(operatorId);

  const remark = ScheduleService.addRemark(req.params.scheduleId, req.body, operatorId);
  res.json({
    success: true,
    data: remark
  });
});

module.exports = router;
