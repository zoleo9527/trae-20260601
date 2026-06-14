const ERROR_CODES = {
  VALIDATION_ERROR: { code: 'E1001', message: '请求参数校验失败', httpStatus: 400 },
  REGISTRATION_NOT_FOUND: { code: 'E2001', message: '报名记录不存在', httpStatus: 404 },
  REGISTRATION_ALREADY_AUDITED: { code: 'E2002', message: '该报名已审核，无法重复操作', httpStatus: 409 },
  REGISTRATION_STATUS_INVALID: { code: 'E2003', message: '报名状态不允许此操作', httpStatus: 409 },
  AUDIT_ACTION_INVALID: { code: 'E2004', message: '审核操作类型无效，仅允许 approve 或 reject', httpStatus: 400 },
  REJECT_REASON_REQUIRED: { code: 'E2005', message: '退回时必须填写退回原因', httpStatus: 400 },
  EXAM_ROOM_NOT_FOUND: { code: 'E3001', message: '考场不存在或容量已满', httpStatus: 404 },
  TICKET_ALREADY_GENERATED: { code: 'E4001', message: '准考证已生成，请勿重复操作', httpStatus: 409 },
  TICKET_NOT_FOUND: { code: 'E4002', message: '准考证不存在，请先生成', httpStatus: 404 },
  TICKET_NOT_APPROVED: { code: 'E4003', message: '报名未通过审核，无法生成准考证', httpStatus: 409 },
  USER_NOT_FOUND: { code: 'E5001', message: '用户不存在', httpStatus: 404 },
  ROLE_UNAUTHORIZED: { code: 'E5002', message: '当前角色无权执行此操作', httpStatus: 403 },
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
