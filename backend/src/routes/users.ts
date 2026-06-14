import { Router } from 'express';
import { getDatabase, User } from '../database';

const router = Router();

router.post('/login', async (req, res) => {
  try {
    const { username, password, role } = req.body;
    const db = await getDatabase();
    
    const user = await db.get<User>(
      'SELECT * FROM users WHERE username = ? AND password = ? AND role = ?',
      [username, password, role]
    );

    if (user) {
      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            username: user.username,
            display_name: user.display_name,
            role: user.role
          },
          token: `token_${user.id}_${Date.now()}`
        }
      });
    } else {
      res.status(401).json({ success: false, error: '用户名或密码错误' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' });
  }
});

router.get('/me', async (req, res) => {
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
    const user = await db.get<User>('SELECT * FROM users WHERE id = ?', [userId]);

    if (user) {
      res.json({
        success: true,
        data: {
          id: user.id,
          username: user.username,
          display_name: user.display_name,
          role: user.role
        }
      });
    } else {
      res.status(404).json({ success: false, error: '用户不存在' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' });
  }
});

router.get('/', async (req, res) => {
  try {
    const db = await getDatabase();
    const users = await db.all<User>('SELECT id, username, display_name, role FROM users');
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' });
  }
});

router.post('/logout', (req, res) => {
  res.json({ success: true, message: '已登出' });
});

export default router;
