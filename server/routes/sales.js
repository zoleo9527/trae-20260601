import express from 'express';
import * as salesRepo from '../repositories/salesRepo.js';
import * as inventoryRepo from '../repositories/inventoryRepo.js';
import * as creditRepo from '../repositories/creditRepo.js';

const router = express.Router();

// 获取销售单列表
router.get('/', (req, res) => {
  try {
    const { status, date, customerId } = req.query;
    const sales = salesRepo.getAllSales({ status, date, customerId });
    res.json({ success: true, data: sales });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
});

// 获取单个销售单
router.get('/:id', (req, res) => {
  try {
    const sale = salesRepo.getSalesById(req.params.id);
    if (!sale) {
      return res.status(404).json({ success: false, error: { message: 'Sales not found' } });
    }
    res.json({ success: true, data: sale });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
});

// 创建销售单
router.post('/', (req, res) => {
  try {
    // 检查客户是否有逾期赊账
    if (req.body.isCredit) {
      const overdueStatus = creditRepo.getCustomerOverdueStatus(req.body.customerId);
      if (overdueStatus.hasOverdue) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'CREDIT_OVERDUE',
            message: `该客户有 ${overdueStatus.count} 笔逾期赊账，合计 ${overdueStatus.totalDue} 元，请先还款`,
            details: overdueStatus
          }
        });
      }
    }

    const sale = salesRepo.createSales(req.body);
    res.status(201).json({ success: true, data: sale });
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } });
  }
});

// 更新销售单
router.put('/:id', (req, res) => {
  try {
    const sale = salesRepo.updateSales(req.params.id, req.body);
    res.json({ success: true, data: sale });
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } });
  }
});

// 提交销售单
router.post('/:id/submit', (req, res) => {
  try {
    const sale = salesRepo.submitSales(req.params.id, req.body.operatorId);
    res.json({ success: true, data: sale });
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } });
  }
});

// 农技员确认/退回
router.post('/:id/confirm', (req, res) => {
  try {
    const result = salesRepo.confirmSales(req.params.id, req.body.operatorId, req.body);

    // 如果是禁用农药被退回，返回特殊标记
    if (result.status === 'rejected') {
      return res.json({
        success: true,
        data: result,
        warning: '该销售单因农药类型为禁用/禁限用药已被退回'
      });
    }

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } });
  }
});

// 仓管出库确认
router.post('/:id/warehouse-confirm', (req, res) => {
  try {
    const result = salesRepo.warehouseConfirm(req.params.id, req.body.operatorId, req.body);

    if (result.error) {
      return res.status(409).json({
        success: false,
        error: result.error
      });
    }

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } });
  }
});

// 重置异常单
router.post('/:id/reset', (req, res) => {
  try {
    const sale = salesRepo.resetSales(req.params.id, req.body.operatorId);
    res.json({ success: true, data: sale });
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } });
  }
});

// 取消销售单
router.post('/:id/cancel', (req, res) => {
  try {
    const sale = salesRepo.cancelSales(req.params.id, req.body.operatorId);
    res.json({ success: true, data: sale });
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } });
  }
});

export default router;
