const prisma = require('../config/prisma');

async function userContext(req, res, next) {
  const userId = req.headers['x-user-id'];

  if (userId) {
    const user = await prisma.user.findUnique({
      where: { id: Number(userId) },
    });
    if (user) {
      req.user = user;
    }
  }

  if (!req.user) {
    const defaultUser = await prisma.user.findFirst({
      where: { role: 'STORE_MANAGER' },
    });
    if (defaultUser) {
      req.user = defaultUser;
    }
  }

  next();
}

module.exports = userContext;
