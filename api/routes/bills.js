import { Router } from 'express';
import * as dataService from '../services/dataService';

const router = Router();

router.get('/', (req, res) => {
  const bills = dataService.getAllBills();
  res.json(bills);
});

router.get('/:id', (req, res) => {
  const bill = dataService.getBillById(req.params.id);
  if (!bill) {
    return res.status(404).json({ error: 'Bill not found' });
  }
  res.json(bill);
});

router.patch('/:id/status', (req, res) => {
  const { status } = req.body;
  const bill = dataService.updateBillStatus(req.params.id, status);
  if (!bill) {
    return res.status(404).json({ error: 'Bill not found' });
  }
  res.json(bill);
});

router.get('/:id/disputes', (req, res) => {
  const disputes = dataService.getDisputesByBillId(req.params.id);
  res.json(disputes);
});

router.post('/generate', (req, res) => {
  const { propertyId, year, month } = req.body;
  if (!propertyId || !year || !month) {
    return res.status(400).json({ error: 'propertyId, year, and month are required' });
  }
  const bill = dataService.generateBill(propertyId, year, month);
  if (!bill) {
    return res.status(404).json({ error: 'Property not found' });
  }
  res.status(201).json(bill);
});

export default router;
