const jwt = require('jsonwebtoken');
const prisma = require('../prisma/client');

const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });

    if (!user) {
      return res.status(401).json({ error: 'Invalid token.' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token.' });
  }
};

const requireAdmin = (req, res, next) => {
  if (!['PROJECT_MANAGER', 'REVIEWER', 'FINANCE'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Access denied. Admin role required.' });
  }
  next();
};

const requireProjectManager = (req, res, next) => {
  if (req.user.role !== 'PROJECT_MANAGER') {
    return res.status(403).json({ error: 'Access denied. Project Manager role required.' });
  }
  next();
};

const requireReviewer = (req, res, next) => {
  if (req.user.role !== 'REVIEWER') {
    return res.status(403).json({ error: 'Access denied. Reviewer role required.' });
  }
  next();
};

const requireFinance = (req, res, next) => {
  if (req.user.role !== 'FINANCE') {
    return res.status(403).json({ error: 'Access denied. Finance role required.' });
  }
  next();
};

const requireBidder = (req, res, next) => {
  if (req.user.role !== 'BIDDER') {
    return res.status(403).json({ error: 'Access denied. Bidder role required.' });
  }
  next();
};

module.exports = {
  authenticate,
  requireAdmin,
  requireProjectManager,
  requireReviewer,
  requireFinance,
  requireBidder
};