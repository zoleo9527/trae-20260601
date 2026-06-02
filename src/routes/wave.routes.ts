import { Router } from 'express';
import * as waveController from '../controllers/wave.controller';

const router = Router();

router.post('/', waveController.createWave);
router.get('/', waveController.listWaves);
router.get('/:waveId', waveController.getWave);
router.post('/:waveId/start', waveController.startWave);
router.post('/:waveId/complete', waveController.completeWave);
router.get('/:waveId/traceability', waveController.getWaveTraceability);

export default router;
