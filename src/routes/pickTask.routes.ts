import { Router } from 'express';
import * as pickTaskController from '../controllers/pickTask.controller';

const router = Router();

router.get('/available', pickTaskController.getAvailableTasks);
router.get('/my/:pickerId', pickTaskController.getMyTasks);
router.get('/:taskId', pickTaskController.getTask);
router.post('/assign', pickTaskController.assignTask);
router.post('/:taskId/start', pickTaskController.startPicking);
router.post('/:taskId/complete', pickTaskController.completeTask);

export default router;
