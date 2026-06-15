const express = require('express');
const DrawingService = require('../services/drawingService');
const AuthService = require('../services/authService');
const IdempotencyService = require('../services/idempotencyService');

const router = express.Router();

router.get('/', (req, res) => {
  let drawings;
  if (req.query.projectId) {
    drawings = DrawingService.listByProject(req.query.projectId);
  } else {
    const { store } = require('../data/store');
    drawings = store.drawings;
  }
  res.json({
    success: true,
    data: drawings,
    total: drawings.length
  });
});

router.get('/history/:projectId', (req, res) => {
  const history = DrawingService.getHistory(req.params.projectId);
  res.json({
    success: true,
    data: history
  });
});

router.get('/:drawingId', (req, res) => {
  const drawing = DrawingService.requireDrawing(req.params.drawingId);
  res.json({
    success: true,
    data: drawing
  });
});

router.post('/submit/:projectId', (req, res) => {
  const idempotencyKey = req.headers['x-idempotency-key'];
  const operatorId = req.headers['x-user-id'];

  const result = IdempotencyService.wrap(idempotencyKey, () => {
    AuthService.requireUser(operatorId);
    const drawing = DrawingService.submitDrawing(req.params.projectId, req.body, operatorId);
    return { drawing };
  });

  res.json({
    success: true,
    data: result.drawing,
    _idempotent: result._idempotent || false,
    _idempotentAt: result._idempotentAt || null
  });
});

router.post('/confirm/:drawingId', (req, res) => {
  const idempotencyKey = req.headers['x-idempotency-key'];
  const operatorId = req.headers['x-user-id'];

  const result = IdempotencyService.wrap(idempotencyKey, () => {
    AuthService.requireUser(operatorId);
    const drawing = DrawingService.confirmDrawing(req.params.drawingId, req.body, operatorId);
    return { drawing };
  });

  res.json({
    success: true,
    data: result.drawing,
    _idempotent: result._idempotent || false,
    _idempotentAt: result._idempotentAt || null
  });
});

router.post('/reject/:drawingId', (req, res) => {
  const idempotencyKey = req.headers['x-idempotency-key'];
  const operatorId = req.headers['x-user-id'];

  const result = IdempotencyService.wrap(idempotencyKey, () => {
    AuthService.requireUser(operatorId);
    const drawing = DrawingService.rejectDrawing(req.params.drawingId, req.body, operatorId);
    return { drawing };
  });

  res.json({
    success: true,
    data: result.drawing,
    _idempotent: result._idempotent || false,
    _idempotentAt: result._idempotentAt || null
  });
});

module.exports = router;
