import { Router } from 'express';
import * as dataService from '../services/dataService';

const router = Router();

router.get('/stats', (req, res) => {
  const stats = dataService.getDashboardStats();
  res.json(stats);
});

export default router;
