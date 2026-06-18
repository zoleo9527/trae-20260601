import { Router } from 'express';
import { login, getProfile } from '../controllers/authController';
import { createServiceRecord, getServiceRecords, getServiceRecordById, checkin, completeService, confirmDuration, rejectDuration, resetRecord, getTodayTasks } from '../controllers/serviceController';
import { getVolunteers, getVolunteerById, createVolunteer, updateVolunteer, deleteVolunteer } from '../controllers/volunteerController';
import { authenticateToken, requireRole } from '../middleware/auth';
import { UserRole } from '../types';

const router = Router();

router.post('/login', login);
router.get('/profile', authenticateToken, getProfile);

router.post('/volunteers', authenticateToken, requireRole(['social_worker', 'community_officer']), createVolunteer);
router.get('/volunteers', authenticateToken, getVolunteers);
router.get('/volunteers/:id', authenticateToken, getVolunteerById);
router.put('/volunteers/:id', authenticateToken, requireRole(['social_worker', 'community_officer']), updateVolunteer);
router.delete('/volunteers/:id', authenticateToken, requireRole(['social_worker', 'community_officer']), deleteVolunteer);

router.post('/services', authenticateToken, createServiceRecord);
router.get('/services', authenticateToken, getServiceRecords);
router.get('/services/:id', authenticateToken, getServiceRecordById);
router.post('/services/checkin', authenticateToken, checkin);
router.post('/services/complete', authenticateToken, completeService);
router.post('/services/confirm', authenticateToken, requireRole(['volunteer_leader', 'community_officer']), confirmDuration);
router.post('/services/reject', authenticateToken, requireRole(['volunteer_leader', 'community_officer']), rejectDuration);
router.post('/services/reset', authenticateToken, requireRole(['social_worker', 'community_officer']), resetRecord);
router.get('/services/today', authenticateToken, getTodayTasks);

export default router;
