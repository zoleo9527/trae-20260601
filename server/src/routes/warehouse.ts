import express from 'express';
import db from '../db.js';

const router = express.Router();

router.get('/locations', (_req, res) => {
  const locations = db.prepare(`
    SELECT * FROM warehouse_locations ORDER BY location_code
  `).all();
  res.json(locations);
});

router.get('/locations/:id', (req, res) => {
  const { id } = req.params;
  const location = db.prepare('SELECT * FROM warehouse_locations WHERE id = ?').get(id);
  if (!location) {
    res.status(404).json({ error: '库位不存在' });
    return;
  }
  res.json(location);
});

router.get('/inventory', (_req, res) => {
  const inventory = db.prepare(`
    SELECT 
      oi.product_code,
      oi.product_name,
      oi.unit,
      oi.warehouse_location,
      SUM(oi.quantity) as total_quantity
    FROM order_items oi
    GROUP BY oi.product_code, oi.warehouse_location
    ORDER BY oi.warehouse_location
  `).all();
  res.json(inventory);
});

export default router;
