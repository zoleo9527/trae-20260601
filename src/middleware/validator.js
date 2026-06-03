export function validateRequired(fields) {
  return (req, res, next) => {
    const missing = [];
    for (const field of fields) {
      if (req.body[field] === undefined || req.body[field] === null || req.body[field] === '') {
        missing.push(field);
      }
    }
    if (missing.length > 0) {
      const err = new Error(`缺少必填字段: ${missing.join(', ')}`);
      err.statusCode = 400;
      return next(err);
    }
    next();
  };
}

export function validatePagination(req, res, next) {
  const { page = 1, pageSize = 20 } = req.query;
  req.query.page = Math.max(1, parseInt(page) || 1);
  req.query.pageSize = Math.min(100, Math.max(1, parseInt(pageSize) || 20));
  next();
}

export function validateIdParam(req, res, next) {
  const id = parseInt(req.params.id);
  if (isNaN(id) || id <= 0) {
    const err = new Error('无效的ID参数');
    err.statusCode = 400;
    return next(err);
  }
  req.params.id = id;
  next();
}
