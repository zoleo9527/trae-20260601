const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { db } = require('../data/database');

const JWT_SECRET = 'mySecretKeyForJwtTokenGenerationMustBeLongEnough123456';
const JWT_EXPIRATION = '24h';

function generateToken(user) {
  return jwt.sign(
    { 
      userId: user.id, 
      username: user.username, 
      role: user.role 
    }, 
    JWT_SECRET, 
    { expiresIn: JWT_EXPIRATION }
  );
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (!token) {
    return res.status(401).json({ success: false, message: '未提供认证令牌', data: null });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.users.find(u => u.id === decoded.userId);
    if (!user) {
      return res.status(401).json({ success: false, message: '用户不存在', data: null });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({ success: false, message: '认证令牌无效或已过期', data: null });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: '权限不足，无法执行此操作', data: null });
    }
    next();
  };
}

const authRouter = require('express').Router();

authRouter.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ success: false, message: '用户名和密码不能为空', data: null });
  }

  const user = db.users.find(u => u.username === username);
  if (!user) {
    return res.status(401).json({ success: false, message: '用户名或密码错误', data: null });
  }

  const isValid = bcrypt.compareSync(password, user.password);
  if (!isValid) {
    return res.status(401).json({ success: false, message: '用户名或密码错误', data: null });
  }

  const token = generateToken(user);
  
  res.json({
    success: true,
    message: '登录成功',
    data: {
      token,
      type: 'Bearer',
      userId: user.id,
      username: user.username,
      realName: user.realName,
      role: user.role
    }
  });
});

module.exports = {
  authRouter,
  authenticateToken,
  requireRole,
  generateToken
};
