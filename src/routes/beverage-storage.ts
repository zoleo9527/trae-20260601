import { Router } from 'express';
import { beverageStorageService } from '../services/index.js';

const router = Router();

router.post('/', async (req, res) => {
  try {
    const barStaffId = req.headers['x-bar-staff-id'] as string;
    if (!barStaffId) {
      return res.status(401).json({ error: '缺少吧台员工ID' });
    }

    const result = await beverageStorageService.createStorage(req.body, barStaffId);
    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating beverage storage:', error);
    res.status(500).json({ error: '创建寄存记录失败' });
  }
});

router.get('/reservation/:reservationId', async (req, res) => {
  try {
    const { BeverageStorageRepository } = await import('../repositories/index.js');
    const repo = new BeverageStorageRepository();
    const beverages = repo.findByReservationId(req.params.reservationId);
    res.json(beverages);
  } catch (error) {
    console.error('Error fetching beverage storage:', error);
    res.status(500).json({ error: '获取寄存记录失败' });
  }
});

router.post('/:id/unclear', async (req, res) => {
  try {
    const barStaffId = req.headers['x-bar-staff-id'] as string;
    if (!barStaffId) {
      return res.status(401).json({ error: '缺少吧台员工ID' });
    }

    const result = await beverageStorageService.markAsUnclear(
      req.params.id,
      barStaffId,
      req.body.reason
    );
    res.json(result);
  } catch (error) {
    console.error('Error marking beverage as unclear:', error);
    res.status(500).json({ error: '标记寄存酒状态失败' });
  }
});

router.post('/:id/retrieve', async (req, res) => {
  try {
    const barStaffId = req.headers['x-bar-staff-id'] as string;
    if (!barStaffId) {
      return res.status(401).json({ error: '缺少吧台员工ID' });
    }

    const result = await beverageStorageService.retrieveBeverage(req.params.id, barStaffId);
    res.json(result);
  } catch (error) {
    console.error('Error retrieving beverage:', error);
    res.status(500).json({ error: '取回酒水失败' });
  }
});

export default router;
