import { Router } from 'express';
import * as dataService from '../services/dataService';

const router = Router();

router.get('/', (req, res) => {
  const disputes = dataService.getAllDisputes();
  res.json(disputes);
});

router.get('/:id', (req, res) => {
  const dispute = dataService.getDisputeById(req.params.id);
  if (!dispute) {
    return res.status(404).json({ error: 'Dispute not found' });
  }
  res.json(dispute);
});

router.post('/', (req, res) => {
  const newDispute = dataService.addDispute(req.body);
  res.status(201).json(newDispute);
});

router.post('/:id/messages', (req, res) => {
  const { sender, content } = req.body;
  const dispute = dataService.addDisputeMessage(req.params.id, sender, content);
  if (!dispute) {
    return res.status(404).json({ error: 'Dispute not found' });
  }
  res.json(dispute);
});

router.patch('/:id/resolve', (req, res) => {
  const { status, resolution } = req.body;
  const dispute = dataService.resolveDispute(req.params.id, status, resolution);
  if (!dispute) {
    return res.status(404).json({ error: 'Dispute not found' });
  }
  res.json(dispute);
});

export default router;
