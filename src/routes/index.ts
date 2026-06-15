import { Router } from 'express';
import authRoutes from './auth';
import claimRoutes from './claims';
import compensationRoutes from './compensations';

const router = Router();

router.use('/auth', authRoutes);
router.use('/claims', claimRoutes);
router.use('/compensations', compensationRoutes);

router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;