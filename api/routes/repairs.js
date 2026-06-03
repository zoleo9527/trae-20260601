import { Router } from 'express';
import * as dataService from '../services/dataService';

const router = Router();

router.get('/', (req, res) => {
  const repairs = dataService.getAllRepairs();
  res.json(repairs);
});

router.get('/:id', (req, res) => {
  const repair = dataService.getRepairById(req.params.id);
  if (!repair) {
    return res.status(404).json({ error: 'Repair not found' });
  }
  res.json(repair);
});

router.post('/', (req, res) => {
  const newRepair = dataService.addRepair(req.body);
  res.status(201).json(newRepair);
});

export default router;
