import { Router } from 'express';
import { store } from '../data-store.js';

const router = Router();

router.get('/users', (req, res) => {
  const users = store.getUsers();
  res.json(users);
});

router.get('/current', (req, res) => {
  const user = req.currentUser!;
  res.json(user);
});

export default router;
