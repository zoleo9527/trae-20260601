import express from 'express';
import * as inventoryRepo from '../repositories/inventoryRepo.js';

const router = express.Router();

// 获取库存列表
router.get('/', (req, res) => {
  try {
    const { pesticideId } = req.query;
    const inventory = inventoryRepo.getAllInventory({ pesticideId });
    res.json({ success: true, data: inventory });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
});

// 获取单个库存
router.get('/:id', (req, res) => {
  try {
    const inventory = inventoryRepo.getInventoryById(req.params.id);
    if (!inventory) {
      return res.status(404).json({ success: false, error: { message: 'Inventory not found' } });
    }
    res.json({ success: true, data: inventory });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
});

// 更新库存
router.put('/:id', (req, res) => {
  try {
    const inventory = inventoryRepo.updateInventory(req.params.id, req.body);
    res.json({ success: true, data: inventory });
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } });
  }
});

// 获取库存预警
router.get('/warnings/list', (req, res) => {
  try {
    const warnings = inventoryRepo.getInventoryWarnings();
    res.json({ success: true, data: warnings });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
});

// 获取季节备货建议
router.get('/seasonal-suggestion', (req, res) => {
  try {
    const suggestion = inventoryRepo.getSeasonalSuggestion();
    res.json({ success: true, data: suggestion });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
});

export default router;
