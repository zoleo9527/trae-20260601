const ERROR_CODES = {
  VALIDATION_ERROR: { code: 'E1001', message: '请求参数校验失败', httpStatus: 400 },
  STUDENT_NOT_FOUND: { code: 'E2001', message: '学员档案不存在', httpStatus: 404 },
  STUDENT_ID_CARD_DUPLICATE: { code: 'E2002', message: '身份证号已存在', httpStatus: 409 },
  COACH_NOT_FOUND: { code: 'E3001', message: '教练不存在', httpStatus: 404 },
  COACH_SCHEDULE_CONFLICT: { code: 'E3002', message: '教练排班时间冲突', httpStatus: 409 },
  EXAM_BOOKING_NOT_FOUND: { code: 'E4001', message: '考试预约记录不存在', httpStatus: 404 },
  EXAM_QUOTA_FULL: { code: 'E4002', message: '该场次考试名额已满', httpStatus: 409 },
  EXAM_STATUS_INVALID: { code: 'E4003', message: '考试预约状态不允许此操作', httpStatus: 409 },
  EXAM_ALREADY_BOOKED: { code: 'E4004', message: '该学员已预约此科目考试', httpStatus: 409 },
  MAKEUP_NOT_FOUND: { code: 'E5001', message: '补考记录不存在', httpStatus: 404 },
  MAKEUP_FEE_UNPAID: { code: 'E5002', message: '补考费用未结清，无法预约', httpStatus: 409 },
  FEE_RECORD_NOT_FOUND: { code: 'E6001', message: '费用记录不存在', httpStatus: 404 },
  USER_NOT_FOUND: { code: 'E7001', message: '用户不存在', httpStatus: 404 },
  ROLE_UNAUTHORIZED: { code: 'E7002', message: '当前角色无权执行此操作', httpStatus: 403 },
  INVALID_STATUS_TRANSITION: { code: 'E8001', message: '无效的状态转换', httpStatus: 409 },
  EXAM_SESSION_NOT_FOUND: { code: 'E4005', message: '考试场次不存在', httpStatus: 404 },
  INTERNAL_ERROR: { code: 'E9999', message: '服务器内部错误', httpStatus: 500 },
};

class AppError extends Error {
  constructor(errorKey, details = null) {
    const err = ERROR_CODES[errorKey] || ERROR_CODES.INTERNAL_ERROR;
    super(err.message);
    this.name = 'AppError';
    this.code = err.code;
    this.errorKey = errorKey;
    this.httpStatus = err.httpStatus;
    this.details = details;
  }

  toJSON() {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        details: this.details,
      },
    };
  }
}

function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    return res.status(err.httpStatus).json(err.toJSON());
  }
  console.error('[Unhandled Error]', err);
  const internal = ERROR_CODES.INTERNAL_ERROR;
  res.status(internal.httpStatus).json({
    success: false,
    error: {
      code: internal.code,
      message: internal.message,
      details: process.env.NODE_ENV === 'development' ? err.message : null,
    },
  });
}

module.exports = { ERROR_CODES, AppError, asyncHandler, errorHandler };
