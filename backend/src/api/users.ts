import express from 'express';
import { getDb } from '../database';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const db = await getDb();
    const users = await db.all('SELECT * FROM users ORDER BY role');
    await db.close();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const db = await getDb();
    const user = await db.get('SELECT * FROM users WHERE id = ?', [req.params.id]);
    
    if (!user) {
      await db.close();
      return res.status(404).json({ error: '用户不存在' });
    }
    
    await db.close();
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/role/:role', async (req, res) => {
  try {
    const db = await getDb();
    const users = await db.all('SELECT * FROM users WHERE role = ?', [req.params.role]);
    await db.close();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { id, name, role, phone } = req.body;
    
    if (!name || !role) {
      return res.status(400).json({ error: '缺少必要参数' });
    }
    
    const db = await getDb();
    
    await db.run(`
      INSERT INTO users (id, name, role, phone)
      VALUES (?, ?, ?, ?)
    `, [id || `u${Date.now()}`, name, role, phone]);
    
    await db.close();
    res.status(201).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
