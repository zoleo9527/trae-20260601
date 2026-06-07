const jwt = require('jsonwebtoken');
const db = require('../db');

const JWT_SECRET = 'dairy-station-secret-key-2024';

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未提供认证令牌' });
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.prepare('SELECT id, username, name, role FROM users WHERE id = ?').get(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: '用户不存在' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: '无效的认证令牌' });
  }
}

function requireRoles(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: '权限不足' });
    }
    next();
  };
}

function createToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

module.exports = { authMiddleware, requireRoles, createToken, JWT_SECRET };
