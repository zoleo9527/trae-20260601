import { Router } from 'express';
import { dockController } from '../controllers/dockController.js';

const router = Router();

router.get('/', dockController.getAllDocks);
router.put('/:id/assign', dockController.assignDock);

export default router;
