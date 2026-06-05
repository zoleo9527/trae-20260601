function errorHandler(err, req, res, next) {
  console.error('Error:', err);

  if (err.message && err.message.includes('无权')) {
    return res.status(403).json({
      error: 'Forbidden',
      message: err.message,
    });
  }

  if (err.message && err.message.includes('不存在')) {
    return res.status(404).json({
      error: 'Not Found',
      message: err.message,
    });
  }

  if (err.name === 'PrismaClientValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      message: '请求参数格式错误',
    });
  }

  if (err.name === 'PrismaClientKnownRequestError') {
    return res.status(400).json({
      error: 'Database Error',
      message: err.message,
    });
  }

  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message || '服务器内部错误',
  });
}

module.exports = errorHandler;
