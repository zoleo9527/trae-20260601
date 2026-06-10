const express = require('express');
const router = express.Router();
const roleGuard = require('../middleware/roleGuard');
const qualityService = require('../services/qualityService');

router.post(
  '/inspections',
  roleGuard('quality_inspector'),
  async (req, res, next) => {
    try {
      const record = await qualityService.createInspection({
        ...req.body,
        inspectorId: req.currentUser.id,
      });
      res.status(201).json({ success: true, data: record });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/inspections/plan/:planId',
  roleGuard('quality_inspector', 'production_leader'),
  async (req, res, next) => {
    try {
      const records = await qualityService.listInspections(parseInt(req.params.planId, 10));
      res.json({ success: true, data: records });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/inspections/:id',
  roleGuard('quality_inspector', 'production_leader'),
  async (req, res, next) => {
    try {
      const record = await qualityService.getInspectionById(parseInt(req.params.id, 10));
      res.json({ success: true, data: record });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/complaints',
  roleGuard('quality_inspector', 'formulation_engineer'),
  async (req, res, next) => {
    try {
      const { status, category, handlerId } = req.query;
      const filters = {};
      if (status) filters.status = status;
      if (category) filters.category = category;
      if (handlerId) filters.handlerId = parseInt(handlerId, 10);

      const complaints = await qualityService.listComplaints(filters);
      res.json({ success: true, data: complaints });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/complaints/stats',
  roleGuard('quality_inspector'),
  async (req, res, next) => {
    try {
      const stats = await qualityService.getComplaintStats();
      res.json({ success: true, data: stats });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/complaints/:id',
  roleGuard('quality_inspector', 'formulation_engineer'),
  async (req, res, next) => {
    try {
      const complaint = await qualityService.getComplaintById(parseInt(req.params.id, 10));
      res.json({ success: true, data: complaint });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/complaints',
  roleGuard('quality_inspector'),
  async (req, res, next) => {
    try {
      const complaint = await qualityService.createComplaint(req.body);
      res.status(201).json({ success: true, data: complaint });
    } catch (err) {
      next(err);
    }
  }
);

router.patch(
  '/complaints/:id/handle',
  roleGuard('quality_inspector'),
  async (req, res, next) => {
    try {
      const { result } = req.body;
      if (!result) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'result 为必填' },
        });
      }
      const complaint = await qualityService.handleComplaint(
        parseInt(req.params.id, 10),
        req.currentUser.id,
        result
      );
      res.json({ success: true, data: complaint });
    } catch (err) {
      next(err);
    }
  }
);

router.patch(
  '/complaints/:id/resolve',
  roleGuard('quality_inspector'),
  async (req, res, next) => {
    try {
      const { result } = req.body;
      const complaint = await qualityService.resolveComplaint(
        parseInt(req.params.id, 10),
        result
      );
      res.json({ success: true, data: complaint });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
