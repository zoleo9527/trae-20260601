const express = require('express');
const ProjectService = require('../services/projectService');
const AuthService = require('../services/authService');
const IdempotencyService = require('../services/idempotencyService');

const router = express.Router();

router.get('/', (req, res) => {
  const filters = {};
  if (req.query.status) filters.status = req.query.status;
  if (req.query.currentHandler) filters.currentHandler = req.query.currentHandler;
  if (req.query.projectManagerId) filters.projectManagerId = req.query.projectManagerId;
  if (req.query.keyword) filters.keyword = req.query.keyword;

  const projects = ProjectService.listProjects(filters);
  res.json({
    success: true,
    data: projects,
    total: projects.length
  });
});

router.get('/:projectId', (req, res) => {
  const detail = ProjectService.getDetail(req.params.projectId);
  res.json({
    success: true,
    data: detail
  });
});

router.post('/', (req, res) => {
  const idempotencyKey = req.headers['x-idempotency-key'];
  const operatorId = req.headers['x-user-id'];

  const result = IdempotencyService.wrap(idempotencyKey, () => {
    AuthService.requireUser(operatorId);
    const project = ProjectService.createProject(req.body, operatorId);
    return { project };
  });

  res.json({
    success: true,
    data: result.project,
    _idempotent: result._idempotent || false,
    _idempotentAt: result._idempotentAt || null
  });
});

router.post('/:projectId/remarks', (req, res) => {
  const operatorId = req.headers['x-user-id'];
  AuthService.requireUser(operatorId);

  const remark = ProjectService.addRemark(req.params.projectId, req.body, operatorId);
  res.json({
    success: true,
    data: remark
  });
});

module.exports = router;
