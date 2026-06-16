import express from 'express';
import { logService } from '../services/logService';

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const logs = logService.getAllLogs();
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: '获取日志失败', error });
  }
});

export default router;
