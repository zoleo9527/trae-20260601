import { Router } from 'express';
import { recordController } from '../controllers/recordController.js';

const router = Router();

router.get('/', recordController.getAllRecords);
router.post('/', recordController.createRecord);
router.put('/batch/assign-dock', recordController.batchAssignDock);
router.put('/batch/check-in', recordController.batchCheckIn);
router.get('/:id', recordController.getRecordById);
router.put('/:id/status', recordController.updateStatus);
router.put('/:id/discrepancy', recordController.registerDiscrepancy);
router.put('/:id/complete-no-discrepancy', recordController.completeNoDiscrepancy);
router.get('/:id/logs', recordController.getOperationLogs);

export default router;
