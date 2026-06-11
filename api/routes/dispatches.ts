import { Router } from 'express';
import type { Request, Response } from 'express';
import {
  getAllDispatches,
  getDispatchById,
  createDispatch,
  updateDispatch,
  getAvailableReceivers
} from '../services/dispatchService.js';
import type { CreateDispatchRequest, UpdateDispatchRequest } from '../../shared/types.js';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  try {
    const dispatches = getAllDispatches();
    res.json(dispatches);
  } catch (error) {
    console.error('Error getting dispatches:', error);
    res.status(500).json({ error: 'Failed to get dispatches' });
  }
});

router.get('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const dispatch = getDispatchById(id);

    if (!dispatch) {
      return res.status(404).json({ error: 'Dispatch not found' });
    }

    res.json(dispatch);
  } catch (error) {
    console.error('Error getting dispatch:', error);
    res.status(500).json({ error: 'Failed to get dispatch' });
  }
});

router.post('/', (req: Request, res: Response) => {
  try {
    const data = req.body as CreateDispatchRequest;
    const dispatcherId = req.header('X-User-Id') || 'u002';

    const dispatch = createDispatch(data, dispatcherId);
    res.status(201).json(dispatch);
  } catch (error) {
    console.error('Error creating dispatch:', error);
    res.status(500).json({ error: 'Failed to create dispatch' });
  }
});

router.put('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body as UpdateDispatchRequest;
    const operatorId = req.header('X-User-Id') || 'u003';

    const dispatch = updateDispatch(id, data, operatorId);

    if (!dispatch) {
      return res.status(404).json({ error: 'Dispatch not found' });
    }

    res.json(dispatch);
  } catch (error) {
    console.error('Error updating dispatch:', error);
    res.status(500).json({ error: 'Failed to update dispatch' });
  }
});

router.get('/receivers/available', (req: Request, res: Response) => {
  try {
    const receivers = getAvailableReceivers();
    res.json(receivers);
  } catch (error) {
    console.error('Error getting available receivers:', error);
    res.status(500).json({ error: 'Failed to get available receivers' });
  }
});

export default router;
