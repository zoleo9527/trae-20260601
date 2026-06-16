import { Router } from 'express';
import { 
  getAllStockRequestsWithDetails, 
  getStockRequestWithDetails, 
  createStockRequest, 
  updateStockRequestStatus 
} from '../services/stockRequestService';
import { CreateStockRequestDTO, UpdateStockRequestStatusDTO } from '../types';

const router = Router();

router.get('/', (req, res) => {
  const requests = getAllStockRequestsWithDetails();
  res.json(requests);
});

router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid ID' });
  }
  const request = getStockRequestWithDetails(id);
  if (!request) {
    return res.status(404).json({ error: 'Request not found' });
  }
  res.json(request);
});

router.post('/', (req, res) => {
  const dto: CreateStockRequestDTO = req.body;
  
  if (!dto.storeId || !dto.userId || !dto.productId || !dto.requestQty || !dto.reason) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const newRequest = createStockRequest(dto);
  res.status(201).json(newRequest);
});

router.put('/:id/status', (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid ID' });
  }

  const dto: UpdateStockRequestStatusDTO = req.body;
  
  if (!dto.status) {
    return res.status(400).json({ error: 'Status is required' });
  }

  const updatedRequest = updateStockRequestStatus(id, dto);
  if (!updatedRequest) {
    return res.status(404).json({ error: 'Request not found' });
  }
  res.json(updatedRequest);
});

export default router;
