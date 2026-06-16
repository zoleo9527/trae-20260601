import express from 'express';
import { db } from '../database';

const router = express.Router();

router.get('/', (req, res) => {
  db.all('SELECT * FROM stores', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
  });
});

export default router;
