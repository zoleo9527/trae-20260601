import { Router } from 'express';
import * as dataService from '../services/dataService';

const router = Router();

router.get('/', (req, res) => {
  const advances = dataService.getAllAdvances();
  res.json(advances);
});

router.get('/:id', (req, res) => {
  const advance = dataService.getAdvanceById(req.params.id);
  if (!advance) {
    return res.status(404).json({ error: 'Advance not found' });
  }
  res.json(advance);
});

router.post('/', (req, res) => {
  const newAdvance = dataService.addAdvance(req.body);
  res.status(201).json(newAdvance);
});

export default router;
