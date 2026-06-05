const express = require('express');
const DashboardService = require('../services/dashboardService');

const router = express.Router();

router.get('/overview', async (req, res) => {
  const overview = await DashboardService.getOverview();
  res.json({ data: overview });
});

router.get('/kanban', async (req, res) => {
  const kanban = await DashboardService.getKanban();
  res.json({ data: kanban });
});

router.get('/blocked', async (req, res) => {
  const blocked = await DashboardService.getBlockedItems();
  res.json({ data: blocked });
});

router.get('/pending', async (req, res) => {
  const pending = await DashboardService.getPendingItems();
  res.json({ data: pending });
});

module.exports = router;
