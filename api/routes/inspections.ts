import { Router } from 'express';
import type { Request, Response } from 'express';
import {
  getInspections,
  getInspectionById,
  createInspection,
  updateInspectionStatus
} from '../services/inspectionService.js';
import type { RiskLevel, InspectionStatus, CreateInspectionRequest } from '../../shared/types.js';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  try {
    const filters = {
      riskLevel: req.query.riskLevel as RiskLevel | undefined,
      status: req.query.status as InspectionStatus | undefined,
      facilityType: req.query.facilityType as string | undefined
    };

    const inspections = getInspections(filters);
    res.json(inspections);
  } catch (error) {
    console.error('Error getting inspections:', error);
    res.status(500).json({ error: 'Failed to get inspections' });
  }
});

router.get('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const inspection = getInspectionById(id);

    if (!inspection) {
      return res.status(404).json({ error: 'Inspection not found' });
    }

    res.json(inspection);
  } catch (error) {
    console.error('Error getting inspection:', error);
    res.status(500).json({ error: 'Failed to get inspection' });
  }
});

router.post('/', (req: Request, res: Response) => {
  try {
    const data = req.body as CreateInspectionRequest;
    const discovererId = req.header('X-User-Id') || 'u001';

    const inspection = createInspection(data, discovererId);
    res.status(201).json(inspection);
  } catch (error) {
    console.error('Error creating inspection:', error);
    res.status(500).json({ error: 'Failed to create inspection' });
  }
});

router.patch('/:id/status', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, remark } = req.body;
    const operatorId = req.header('X-User-Id') || 'u002';

    const inspection = updateInspectionStatus(id, status as InspectionStatus, operatorId, remark);

    if (!inspection) {
      return res.status(404).json({ error: 'Inspection not found' });
    }

    res.json(inspection);
  } catch (error) {
    console.error('Error updating inspection status:', error);
    res.status(500).json({ error: 'Failed to update inspection status' });
  }
});

export default router;
