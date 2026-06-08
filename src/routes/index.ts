import { Router } from 'express';
import arrivalNoticeRouter from './arrival-notice';
import damageRecordRouter from './damage-record';
import handoverRouter from './handover';
import loadingPlanRouter from './loading-plan';
import pendingTaskRouter from './pending-task';
import stuckOrderRouter from './stuck-order';
import wagonAllocationRouter from './wagon-allocation';

const router = Router();

router.use('/loading-plans', loadingPlanRouter);
router.use('/wagon-allocations', wagonAllocationRouter);
router.use('/arrival-notices', arrivalNoticeRouter);
router.use('/damage-records', damageRecordRouter);
router.use('/stuck-orders', stuckOrderRouter);
router.use('/handovers', handoverRouter);
router.use('/pending-tasks', pendingTaskRouter);

export default router;
