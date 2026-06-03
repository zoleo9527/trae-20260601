import { Router } from 'express';
import * as dataService from '../services/dataService';

const router = Router();

router.get('/', (req, res) => {
  const properties = dataService.getAllProperties();
  res.json(properties);
});

router.get('/:id', (req, res) => {
  const property = dataService.getPropertyById(req.params.id);
  if (!property) {
    return res.status(404).json({ error: 'Property not found' });
  }
  res.json(property);
});

router.get('/:id/orders', (req, res) => {
  const orders = dataService.getOrdersByPropertyId(req.params.id);
  res.json(orders);
});

router.get('/:id/expenses', (req, res) => {
  const expenses = dataService.getExpensesByPropertyId(req.params.id);
  res.json(expenses);
});

router.get('/:id/repairs', (req, res) => {
  const repairs = dataService.getRepairsByPropertyId(req.params.id);
  res.json(repairs);
});

router.get('/:id/advances', (req, res) => {
  const advances = dataService.getAdvancesByPropertyId(req.params.id);
  res.json(advances);
});

router.get('/:id/bills', (req, res) => {
  const bills = dataService.getBillsByPropertyId(req.params.id);
  res.json(bills);
});

export default router;
