import express, { type Request, type Response } from 'express';
import { getLogs } from '../services/logService.js';

const router = express.Router();

router.get('/', (req: Request, res: Response): void => {
  try {
    const { role, action, targetType, limit } = req.query;
    const logs = getLogs({
      role: role as string,
      action: action as string,
      targetType: targetType as string,
      limit: limit ? parseInt(limit as string) : undefined,
    });
    res.json({
      success: true,
      data: logs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取操作日志失败',
    });
  }
});

export default router;
