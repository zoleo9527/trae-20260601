import express from 'express';
import { getDb } from '../database';
import { generateToken, authMiddleware, AuthRequest } from '../middleware/auth';
import { User, AuthUser, UserRole } from '../types';
import { convertToCamelCase, convertFields } from '../utils/fieldConverter';

const router = express.Router();

const hashPassword = (password: string): string => {
  return Buffer.from(password).toString('base64');
};

const verifyPassword = (password: string, hash: string): boolean => {
  return hashPassword(password) === hash;
};

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: '用户名和密码不能为空' });
    return;
  }

  try {
    const db = await getDb();
    const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);

    if (!user) {
      res.status(401).json({ error: '用户名或密码错误' });
      return;
    }

    const userObj = convertFields.user(user);

    if (!verifyPassword(password, user.password)) {
      res.status(401).json({ error: '用户名或密码错误' });
      return;
    }

    const token = generateToken(userObj.id);

    const authUser: AuthUser = {
      id: userObj.id,
      username: userObj.username,
      name: userObj.name,
      role: userObj.role as UserRole,
      phone: userObj.phone,
      email: userObj.email,
      department: userObj.department,
      createdAt: userObj.createdAt,
      updatedAt: userObj.updatedAt,
      token,
    };

    res.json(authUser);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: '登录失败' });
  }
});

router.post('/logout', authMiddleware, (req, res) => {
  res.json({ message: '登出成功' });
});

router.get('/me', authMiddleware, (req: AuthRequest, res) => {
  if (!req.user) {
    res.status(401).json({ error: '未登录' });
    return;
  }
  res.json(req.user);
});

export default router;
