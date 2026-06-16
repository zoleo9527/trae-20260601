import { Router } from 'express';
import { getAllStores, getStoreById } from '../services/storeService';

const router = Router();

router.get('/', (req, res) => {
  const stores = getAllStores();
  res.json(stores);
});

router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid ID' });
  }
  const store = getStoreById(id);
  if (!store) {
    return res.status(404).json({ error: 'Store not found' });
  }
  res.json(store);
});

export default router;
