import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await req.prisma.user.findUnique({
      where: { username }
    });

    if (!user) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      'labor-dispatch-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.post('/register', async (req, res) => {
  try {
    const { username, password, name, role } = req.body;

    const existingUser = await req.prisma.user.findUnique({
      where: { username }
    });

    if (existingUser) {
      return res.status(400).json({ error: '用户名已存在' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await req.prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        name,
        role: role || '一线'
      }
    });

    res.json({
      message: '注册成功',
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: '未授权' });
    }

    const decoded = jwt.verify(token, 'labor-dispatch-secret-key');

    const user = await req.prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        username: true,
        name: true,
        role: true
      }
    });

    if (!user) {
      return res.status(401).json({ error: '用户不存在' });
    }

    res.json(user);
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(401).json({ error: '未授权' });
  }
});

export default router;
