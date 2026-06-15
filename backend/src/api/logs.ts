import express from 'express';
import { getDb } from '../database';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { orderId } = req.query;
    
    const db = await getDb();
    let logs;
    
    if (orderId) {
      logs = await db.all(`
        SELECT * FROM operation_logs 
        WHERE orderId = ? 
        ORDER BY createdAt DESC
      `, [orderId]);
    } else {
      logs = await db.all('SELECT * FROM operation_logs ORDER BY createdAt DESC LIMIT 100');
    }
    
    await db.close();
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
