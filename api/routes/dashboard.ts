import express, { type Request, type Response } from 'express';
import { getDashboardData } from '../services/dashboardService.js';

const router = express.Router();

router.get('/', (req: Request, res: Response): void => {
  try {
    const data = getDashboardData();
    res.json({
      success: true,
      data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取工作台数据失败',
    });
  }
});

export default router;
