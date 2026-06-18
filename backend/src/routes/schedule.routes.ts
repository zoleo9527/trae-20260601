import { Router } from 'express';
import { getScheduleList, getScheduleById, createSchedule, updateSchedule, transitionSchedule } from '../controllers/schedule.controller.js';

const router = Router();

router.get('/', getScheduleList);
router.get('/:id', getScheduleById);
router.post('/', createSchedule);
router.put('/:id', updateSchedule);
router.post('/:id/transition', transitionSchedule);

export { router as scheduleRoutes };