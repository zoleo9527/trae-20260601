const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../database/db');
const { generateToken, authMiddleware } = require('../middleware/auth');
const { getRoleName } = require('../utils/roles');
const router = express.Router();

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ code: 400, message: '用户名和密码不能为空' });
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user) {
    return res.status(401).json({ code: 401, message: '用户名或密码错误' });
  }

  const valid = bcrypt.compareSync(password, user.password);
  if (!valid) {
    return res.status(401).json({ code: 401, message: '用户名或密码错误' });
  }

  const token = generateToken(user);

  res.json({
    code: 200,
    message: '登录成功',
    data: {
      token,
      userInfo: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        roleName: getRoleName(user.role),
        department: user.department,
        brandId: user.brand_id,
      },
    },
  });
});

router.get('/profile', authMiddleware, (req, res) => {
  res.json({
    code: 200,
    data: {
      ...req.user,
      roleName: getRoleName(req.user.role),
    },
  });
});

router.get('/users', authMiddleware, (req, res) => {
  const users = db.prepare(`
    SELECT id, username, name, role, department, phone, brand_id 
    FROM users ORDER BY id
  `).all();

  const roleMap = {};
  for (const u of users) {
    u.roleName = getRoleName(u.role);
  }

  res.json({ code: 200, data: users });
});

module.exports = router;
