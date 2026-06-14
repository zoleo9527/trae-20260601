import { Router } from 'express';
import { getDatabase, Notification } from '../database';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ success: false, error: '未授权' });
    }

    const token = authHeader.replace('Bearer ', '');
    const match = token.match(/token_(\d+)_/);
    
    if (!match) {
      return res.status(401).json({ success: false, error: '无效的令牌' });
    }

    const userId = parseInt(match[1]);
    const db = await getDatabase();
    const notifications = await db.all<Notification>(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    res.json({ success: true, data: notifications });
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' });
  }
});

router.put('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getDatabase();
    await db.run('UPDATE notifications SET is_read = 1 WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' });
  }
});

router.put('/read-all', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ success: false, error: '未授权' });
    }

    const token = authHeader.replace('Bearer ', '');
    const match = token.match(/token_(\d+)_/);
    
    if (!match) {
      return res.status(401).json({ success: false, error: '无效的令牌' });
    }

    const userId = parseInt(match[1]);
    const db = await getDatabase();
    await db.run('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [userId]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' });
  }
});

export default router;
