import express, { type Request, type Response } from 'express';
import { resetAllData } from '../services/resetService.js';

const router = express.Router();

router.post('/', (req: Request, res: Response): void => {
  try {
    resetAllData();
    res.json({
      success: true,
      message: '数据重置成功',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '数据重置失败',
    });
  }
});

export default router;
