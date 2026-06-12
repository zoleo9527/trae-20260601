import express from 'express';
import bcrypt from 'bcryptjs';
import db from '../database';
import { generateToken, authenticate, AuthRequest } from '../middleware/auth';
import { logOperation } from '../utils/operationLogger';
import { UserRole } from '../types';

const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ error: '用户名和密码不能为空' });
      return;
    }

    const hashedPassword = db.userPasswords.get(username);
    if (!hashedPassword) {
      res.status(401).json({ error: '用户名或密码错误' });
      return;
    }

    const isValid = await bcrypt.compare(password, hashedPassword);
    if (!isValid) {
      res.status(401).json({ error: '用户名或密码错误' });
      return;
    }

    const user = Array.from(db.users.values()).find((u) => u.username === username);
    if (!user) {
      res.status(401).json({ error: '用户不存在' });
      return;
    }

    const token = generateToken(user.id);

    logOperation({
      entityType: 'property',
      entityId: 'system',
      action: 'login',
      description: `${user.name} 登录系统`,
      operator: user,
    });

    res.json({
      user,
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: '登录失败' });
  }
});

router.post('/logout', authenticate, (req: AuthRequest, res) => {
  if (req.user) {
    logOperation({
      entityType: 'property',
      entityId: 'system',
      action: 'logout',
      description: `${req.user.name} 退出系统`,
      operator: req.user,
    });
  }
  res.json({ message: '退出成功' });
});

router.get('/me', authenticate, (req: AuthRequest, res) => {
  res.json(req.user);
});

router.get('/demo-accounts', (req, res) => {
  const roleMap: Record<UserRole, string> = {
    rental_consultant: '租赁顾问',
    operation_manager: '运营经理',
    finance: '财务',
  };

  const accounts = Array.from(db.users.values()).map((user) => ({
    username: user.username,
    name: user.name,
    role: user.role,
    roleName: roleMap[user.role],
    password: '123456',
  }));

  res.json(accounts);
});

export default router;
