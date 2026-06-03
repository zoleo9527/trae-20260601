import { Router } from 'express';
import * as dataService from '../services/dataService';

const router = Router();

router.get('/', (req, res) => {
  const landlords = dataService.getAllLandlords();
  res.json(landlords);
});

router.get('/:id', (req, res) => {
  const landlord = dataService.getLandlordById(req.params.id);
  if (!landlord) {
    return res.status(404).json({ error: 'Landlord not found' });
  }
  res.json(landlord);
});

router.get('/:id/summary', (req, res) => {
  const summary = dataService.getLandlordSummary(req.params.id);
  if (!summary.landlord) {
    return res.status(404).json({ error: 'Landlord not found' });
  }
  res.json(summary);
});

router.get('/:id/properties', (req, res) => {
  const properties = dataService.getPropertiesByLandlordId(req.params.id);
  res.json(properties);
});

router.get('/:id/bills', (req, res) => {
  const bills = dataService.getBillsByLandlordId(req.params.id);
  res.json(bills);
});

router.get('/:id/disputes', (req, res) => {
  const disputes = dataService.getDisputesByLandlordId(req.params.id);
  res.json(disputes);
});

export default router;
