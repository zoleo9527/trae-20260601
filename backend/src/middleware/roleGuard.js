const AppError = require('../errors/AppError');

function roleGuard(...allowedRoles) {
  return (req, res, next) => {
    const userRole = req.headers['x-user-role'];
    const userId = req.headers['x-user-id'];

    if (!userRole || !userId) {
      return next(new AppError(401, 'AUTH_MISSING', '缺少身份信息，请在请求头中提供 x-user-role 和 x-user-id'));
    }

    if (!allowedRoles.includes(userRole)) {
      return next(new AppError(403, 'FORBIDDEN', `当前角色 ${userRole} 无权访问此接口，允许的角色: ${allowedRoles.join(', ')}`));
    }

    req.currentUser = { id: parseInt(userId, 10), role: userRole };
    next();
  };
}

module.exports = roleGuard;
