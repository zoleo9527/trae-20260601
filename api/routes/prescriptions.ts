import { Router } from 'express';
import {
  getAllPrescriptions,
  getPrescriptionsByRole,
  getHistoryByRole,
  getTodoCount,
  getPrescriptionDetail,
  createPrescription,
  reviewPrescription,
  decoctPrescription,
  deliveryPrescription,
  signPrescription,
} from '../controllers/prescriptionController';

const router = Router();

router.get('/', getAllPrescriptions);
router.get('/by-role/:role', getPrescriptionsByRole);
router.get('/history/:role', getHistoryByRole);
router.get('/todo-count/:role', getTodoCount);
router.get('/:id', getPrescriptionDetail);
router.post('/', createPrescription);
router.put('/:id/review', reviewPrescription);
router.put('/:id/decoct', decoctPrescription);
router.post('/:id/delivery', deliveryPrescription);
router.put('/:id/sign', signPrescription);

export default router;
