import { Router } from 'express';
import * as afterSalesController from '../controllers/afterSales.controller';

const router = Router();

router.post('/', afterSalesController.createFeedback);
router.get('/', afterSalesController.listFeedbacks);
router.get('/:feedbackId', afterSalesController.getFeedback);
router.post('/:feedbackId/investigate', afterSalesController.startInvestigation);
router.get('/:feedbackId/trace', afterSalesController.traceRootCause);
router.post('/:feedbackId/resolve', afterSalesController.resolveFeedback);
router.post('/:feedbackId/close', afterSalesController.closeFeedback);
router.get('/:feedbackId/chain', afterSalesController.getFullTraceabilityChain);

export default router;
