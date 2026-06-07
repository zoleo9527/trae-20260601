
import { Router, type Request, type Response } from 'express';
import { resetDatabase } from '../db/database.js';

const router = Router();

router.post('/reset', async (_req: Request, res: Response): Promise<void> => {
  try {
    resetDatabase();
    res.json({ success: true, message: '数据已重置' });
  } catch (error) {
    console.error('Reset database error:', error);
    res.status(500).json({ error: '重置数据失败' });
  }
});

export default router;
