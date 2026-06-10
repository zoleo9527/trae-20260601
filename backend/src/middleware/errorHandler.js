function errorHandler(err, req, res, _next) {
  const isOperational = err.isOperational || false;

  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';
  const message = isOperational ? err.message : '服务器内部错误';

  if (!isOperational) {
    console.error('[Unhandled Error]', err);
  }

  res.status(statusCode).json({
    success: false,
    error: { code, message },
  });
}

module.exports = errorHandler;
