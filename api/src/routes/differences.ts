import { Router } from 'express';
import { getAllDifferences, getDifferenceById, createDifference, updateDifferenceStatus } from '../services/differenceService';
import { CreateDifferenceDTO, UpdateDifferenceStatusDTO } from '../types';

const router = Router();

router.get('/', (req, res) => {
  const differences = getAllDifferences();
  res.json(differences);
});

router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid ID' });
  }
  const difference = getDifferenceById(id);
  if (!difference) {
    return res.status(404).json({ error: 'Difference not found' });
  }
  res.json(difference);
});

router.post('/', (req, res) => {
  const dto: CreateDifferenceDTO = req.body;
  
  if (!dto.inspectionId || !dto.type || !dto.description) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const newDifference = createDifference(dto);
  res.status(201).json(newDifference);
});

router.put('/:id/status', (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid ID' });
  }

  const dto: UpdateDifferenceStatusDTO = req.body;
  
  if (!dto.status) {
    return res.status(400).json({ error: 'Status is required' });
  }

  const updatedDifference = updateDifferenceStatus(id, dto);
  if (!updatedDifference) {
    return res.status(404).json({ error: 'Difference not found' });
  }
  res.json(updatedDifference);
});

export default router;
