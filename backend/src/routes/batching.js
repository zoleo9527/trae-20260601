const express = require('express');
const router = express.Router();
const roleGuard = require('../middleware/roleGuard');
const batchingService = require('../services/batchingService');

router.get(
  '/',
  roleGuard('production_leader', 'quality_inspector', 'formulation_engineer'),
  async (req, res, next) => {
    try {
      const { status, shift, formulaId, creatorId } = req.query;
      const filters = {};
      if (status) filters.status = status;
      if (shift) filters.shift = shift;
      if (formulaId) filters.formulaId = parseInt(formulaId, 10);
      if (creatorId) filters.creatorId = parseInt(creatorId, 10);

      const plans = await batchingService.listPlans(filters);
      res.json({ success: true, data: plans });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/history/formula/:formulaId',
  roleGuard('production_leader', 'quality_inspector', 'formulation_engineer'),
  async (req, res, next) => {
    try {
      const { formulaCode } = req.query;
      const history = await batchingService.getPlanHistory(
        parseInt(req.params.formulaId, 10),
        formulaCode
      );
      res.json({ success: true, data: history });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/:id',
  roleGuard('production_leader', 'quality_inspector', 'formulation_engineer'),
  async (req, res, next) => {
    try {
      const plan = await batchingService.getPlanById(parseInt(req.params.id, 10));
      res.json({ success: true, data: plan });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/',
  roleGuard('production_leader'),
  async (req, res, next) => {
    try {
      const plan = await batchingService.createPlan({
        ...req.body,
        creatorId: req.currentUser.id,
      });
      res.status(201).json({ success: true, data: plan });
    } catch (err) {
      next(err);
    }
  }
);

router.patch(
  '/:id/start',
  roleGuard('production_leader'),
  async (req, res, next) => {
    try {
      const plan = await batchingService.startPlan(parseInt(req.params.id, 10));
      res.json({ success: true, data: plan });
    } catch (err) {
      next(err);
    }
  }
);

router.patch(
  '/:id/complete',
  roleGuard('production_leader'),
  async (req, res, next) => {
    try {
      const { actualQty } = req.body;
      if (actualQty == null) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'actualQty 为必填' },
        });
      }
      const plan = await batchingService.completePlan(parseInt(req.params.id, 10), actualQty);
      res.json({ success: true, data: plan });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/:planId/records',
  roleGuard('production_leader', 'quality_inspector'),
  async (req, res, next) => {
    try {
      const records = await batchingService.listPlanRecords(parseInt(req.params.planId, 10));
      res.json({ success: true, data: records });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/:planId/records',
  roleGuard('production_leader'),
  async (req, res, next) => {
    try {
      const record = await batchingService.addBatchingRecord(
        parseInt(req.params.planId, 10),
        req.body
      );
      res.status(201).json({ success: true, data: record });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
