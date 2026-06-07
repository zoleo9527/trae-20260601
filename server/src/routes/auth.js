const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { createToken, authMiddleware } = require('../middleware/auth');
const { logOperation } = require('../utils/logger');

const router = express.Router();

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' });
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }

  const isValid = bcrypt.compareSync(password, user.password);
  if (!isValid) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }

  const token = createToken(user.id);
  logOperation(user.id, 'login', 'user', user.id, { username: user.username });

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role
    }
  });
});

router.post('/logout', authMiddleware, (req, res) => {
  logOperation(req.user.id, 'logout', 'user', req.user.id);
  res.json({ message: '登出成功' });
});

router.get('/me', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
