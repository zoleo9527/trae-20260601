import { Router } from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const router = Router();

router.post('/', async (req, res) => {
  try {
    await execAsync('npx prisma db push --force-reset');
    await execAsync('node prisma/seed.js');
    
    res.json({
      success: true,
      message: '种子数据已重置并初始化'
    });
  } catch (error) {
    console.error('Seed error:', error);
    res.status(500).json({
      success: false,
      error: '种子数据初始化失败',
      details: error.message
    });
  }
});

export default router;
