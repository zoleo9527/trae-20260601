import { Router } from 'express';
import { getMaterialList, getMaterialById, getMaterialByScheduleId, createMaterial, transitionMaterial, acknowledgeMaterial, claimMaterial } from '../controllers/material.controller.js';

const router = Router();

router.get('/', getMaterialList);
router.get('/:id', getMaterialById);
router.get('/schedule/:scheduleId', getMaterialByScheduleId);
router.post('/', createMaterial);
router.post('/:id/transition', transitionMaterial);
router.post('/:id/acknowledge', acknowledgeMaterial);
router.post('/:id/claim', claimMaterial);

export { router as materialRoutes };