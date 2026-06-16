import { Router } from 'express';
import { getAllInspections, getInspectionById, createInspection } from '../services/inspectionService';
import { CreateInspectionDTO } from '../types';

const router = Router();

router.get('/', (req, res) => {
  const inspections = getAllInspections();
  res.json(inspections);
});

router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid ID' });
  }
  const inspection = getInspectionById(id);
  if (!inspection) {
    return res.status(404).json({ error: 'Inspection not found' });
  }
  res.json(inspection);
});

router.post('/', (req, res) => {
  const dto: CreateInspectionDTO = req.body;
  
  if (!dto.requestId || !dto.actualQty || !dto.inspectorId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const newInspection = createInspection(dto);
  res.status(201).json(newInspection);
});

export default router;
