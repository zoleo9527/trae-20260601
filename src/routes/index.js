import { Router } from 'express';
import cabinetsRouter from './cabinets.js';
import cellsRouter from './cells.js';
import ordersRouter from './orders.js';
import remoteOpenRouter from './remote-open.js';
import exceptionsRouter from './exceptions.js';
import timeoutRemindersRouter from './timeout-reminders.js';

const router = Router();

router.get('/health', (req, res) => {
  res.json({
    code: 200,
    message: 'OK',
    data: {
      service: 'smart-laundry-cabinet',
      version: '1.0.0',
      timestamp: Date.now(),
    },
  });
});

router.use('/cabinets', cabinetsRouter);
router.use('/cells', cellsRouter);
router.use('/orders', ordersRouter);
router.use('/remote-open', remoteOpenRouter);
router.use('/exceptions', exceptionsRouter);
router.use('/timeout-reminders', timeoutRemindersRouter);

export default router;
