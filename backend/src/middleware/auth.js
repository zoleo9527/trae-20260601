const jwt = require('jsonwebtoken');
const { hasPermission } = require('../utils/roles');
const db = require('../database/db');

const JWT_SECRET = 'outlet-lease-secret-key-2026';

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ code: 401, message: '未登录或Token无效' });
  }

  try {
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.prepare('SELECT id, username, name, role, department, brand_id FROM users WHERE id = ?').get(decoded.id);
    if (!user) {
      return res.status(401).json({ code: 401, message: '用户不存在' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ code: 401, message: 'Token已过期或无效' });
  }
};

const permissionMiddleware = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ code: 401, message: '未登录' });
    }
    if (!hasPermission(req.user.role, permission)) {
      return res.status(403).json({ code: 403, message: '权限不足，无法执行此操作' });
    }
    next();
  };
};

module.exports = { generateToken, authMiddleware, permissionMiddleware, JWT_SECRET };
