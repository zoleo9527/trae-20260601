const express = require('express');
const router = express.Router();
const roleGuard = require('../middleware/roleGuard');
const formulaService = require('../services/formulaService');

router.get(
  '/',
  roleGuard('formulation_engineer', 'quality_inspector', 'production_leader'),
  async (req, res, next) => {
    try {
      const { status, species, stage, submitterId } = req.query;
      const filters = {};
      if (status) filters.status = status;
      if (species) filters.species = species;
      if (stage) filters.stage = stage;
      if (submitterId) filters.submitterId = parseInt(submitterId, 10);

      const formulas = await formulaService.listFormulas(filters);
      res.json({ success: true, data: formulas });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/history/:code',
  roleGuard('formulation_engineer', 'quality_inspector'),
  async (req, res, next) => {
    try {
      const history = await formulaService.getFormulaHistory(req.params.code);
      res.json({ success: true, data: history });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/:id',
  roleGuard('formulation_engineer', 'quality_inspector', 'production_leader'),
  async (req, res, next) => {
    try {
      const formula = await formulaService.getFormulaById(parseInt(req.params.id, 10));
      res.json({ success: true, data: formula });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/',
  roleGuard('formulation_engineer'),
  async (req, res, next) => {
    try {
      const formula = await formulaService.createFormula({
        ...req.body,
        submitterId: req.currentUser.id,
      });
      res.status(201).json({ success: true, data: formula });
    } catch (err) {
      next(err);
    }
  }
);

router.patch(
  '/:id/submit',
  roleGuard('formulation_engineer'),
  async (req, res, next) => {
    try {
      const formula = await formulaService.submitForReview(parseInt(req.params.id, 10));
      res.json({ success: true, data: formula });
    } catch (err) {
      next(err);
    }
  }
);

router.patch(
  '/:id/review',
  roleGuard('formulation_engineer'),
  async (req, res, next) => {
    try {
      const { action, comment } = req.body;
      if (!action || !['approve', 'reject'].includes(action)) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'action 必须为 approve 或 reject' },
        });
      }
      const formula = await formulaService.reviewFormula(
        parseInt(req.params.id, 10),
        req.currentUser.id,
        action,
        comment
      );
      res.json({ success: true, data: formula });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
