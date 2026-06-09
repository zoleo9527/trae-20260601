import express from 'express';
import * as creditRepo from '../repositories/creditRepo.js';

const router = express.Router();

// 获取赊账列表
router.get('/', (req, res) => {
  try {
    const { status, customerId } = req.query;
    const credits = creditRepo.getAllCredits({ status, customerId });
    res.json({ success: true, data: credits });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
});

// 获取单个赊账
router.get('/:id', (req, res) => {
  try {
    const credit = creditRepo.getCreditById(req.params.id);
    if (!credit) {
      return res.status(404).json({ success: false, error: { message: 'Credit not found' } });
    }
    res.json({ success: true, data: credit });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
});

// 还款登记
router.post('/:id/repay', (req, res) => {
  try {
    const { amount, operatorId } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, error: { message: 'Invalid amount' } });
    }
    const credit = creditRepo.repayCredit(req.params.id, amount, operatorId);
    res.json({ success: true, data: credit });
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } });
  }
});

// 获取逾期赊账
router.get('/status/overdue', (req, res) => {
  try {
    const overdue = creditRepo.getOverdueCredits();
    res.json({ success: true, data: overdue });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
});

// 检查客户逾期状态
router.get('/customer/:customerId/overdue-status', (req, res) => {
  try {
    const status = creditRepo.getCustomerOverdueStatus(req.params.customerId);
    res.json({ success: true, data: status });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
});

export default router;
