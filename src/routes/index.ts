import { Router } from 'express';
import loadingPlanRouter from './loading-plan';
import wagonAllocationRouter from './wagon-allocation';
import arrivalNoticeRouter from './arrival-notice';
import damageRecordRouter from './damage-record';
import stuckOrderRouter from './stuck-order';
import handoverRouter from './handover';

const router = Router();

router.use('/loading-plans', loadingPlanRouter);
router.use('/wagon-allocations', wagonAllocationRouter);
router.use('/arrival-notices', arrivalNoticeRouter);
router.use('/damage-records', damageRecordRouter);
router.use('/stuck-orders', stuckOrderRouter);
router.use('/handovers', handoverRouter);

export default router;
