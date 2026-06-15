import express from 'express';
import { getDb } from '../database';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const db = await getDb();
    const locations = await db.all('SELECT * FROM locations ORDER BY zone, rack, level');
    await db.close();
    res.json(locations);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/available', async (req, res) => {
  try {
    const db = await getDb();
    const locations = await db.all(`
      SELECT * FROM locations 
      WHERE status = 'empty' OR status = 'reserved'
      ORDER BY zone, rack, level
    `);
    await db.close();
    res.json(locations);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const db = await getDb();
    const location = await db.get('SELECT * FROM locations WHERE id = ?', [req.params.id]);
    
    if (!location) {
      await db.close();
      return res.status(404).json({ error: '库位不存在' });
    }
    
    await db.close();
    res.json(location);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { code, zone, rack, level, capacity } = req.body;
    
    if (!code || !zone || !capacity) {
      return res.status(400).json({ error: '缺少必要参数' });
    }
    
    const db = await getDb();
    
    const existing = await db.get('SELECT * FROM locations WHERE code = ?', [code]);
    if (existing) {
      await db.close();
      return res.status(400).json({ error: '库位编码已存在' });
    }
    
    await db.run(`
      INSERT INTO locations (id, code, zone, rack, level, capacity, currentQty)
      VALUES (?, ?, ?, ?, ?, ?, 0)
    `, [req.body.id || `loc${Date.now()}`, code, zone, rack, level, capacity]);
    
    await db.close();
    res.status(201).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { code, zone, rack, level, capacity, status } = req.body;
    
    const db = await getDb();
    const location = await db.get('SELECT * FROM locations WHERE id = ?', [req.params.id]);
    
    if (!location) {
      await db.close();
      return res.status(404).json({ error: '库位不存在' });
    }
    
    await db.run(`
      UPDATE locations 
      SET code = COALESCE(?, code),
          zone = COALESCE(?, zone),
          rack = COALESCE(?, rack),
          level = COALESCE(?, level),
          capacity = COALESCE(?, capacity),
          status = COALESCE(?, status),
          updatedAt = ?
      WHERE id = ?
    `, [code, zone, rack, level, capacity, status, new Date().toISOString(), req.params.id]);
    
    await db.close();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const db = await getDb();
    const location = await db.get('SELECT * FROM locations WHERE id = ?', [req.params.id]);
    
    if (!location) {
      await db.close();
      return res.status(404).json({ error: '库位不存在' });
    }
    
    if (location.status === 'occupied') {
      await db.close();
      return res.status(400).json({ error: '库位正在使用中，无法删除' });
    }
    
    await db.run('DELETE FROM locations WHERE id = ?', [req.params.id]);
    await db.close();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
