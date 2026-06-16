import express from 'express';
import { db } from '../database';

const router = express.Router();

router.get('/', (req, res) => {
  db.all('SELECT * FROM operation_logs ORDER BY operation_time DESC', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
  });
});

export default router;
