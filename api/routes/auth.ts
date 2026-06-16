import express from 'express';
import { userService } from '../services/userService';

const router = express.Router();

router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;
    const user = userService.login(username, password);
    
    if (!user) {
      return res.status(401).json({ message: '用户名或密码错误' });
    }

    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ message: '登录失败', error });
  }
});

router.get('/users', (req, res) => {
  try {
    const users = userService.getAllUsers();
    const usersWithoutPassword = users.map(({ password, ...user }) => user);
    res.json(usersWithoutPassword);
  } catch (error) {
    res.status(500).json({ message: '获取用户列表失败', error });
  }
});

export default router;
