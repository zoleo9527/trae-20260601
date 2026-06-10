const ERROR_CODES = {
  AUTH_MISSING: { statusCode: 401, message: '缺少身份信息' },
  FORBIDDEN: { statusCode: 403, message: '无权访问' },
  SELF_REVIEW_FORBIDDEN: { statusCode: 403, message: '禁止提交人自审' },
  NOT_FOUND: { statusCode: 404, message: '资源不存在' },
  VALIDATION_ERROR: { statusCode: 400, message: '参数校验失败' },
  FORMULA_DRAFT_ONLY: { statusCode: 409, message: '仅草稿状态可提交审批' },
  FORMULA_PENDING_ONLY: { statusCode: 409, message: '仅待审核状态可审核' },
  FORMULA_APPROVED_ONLY: { statusCode: 409, message: '仅已审批配方可创建投料计划' },
  PLAN_STATUS_ERROR: { statusCode: 409, message: '投料计划状态不允许此操作' },
  RECORD_EXISTS: { statusCode: 409, message: '记录已存在' },
  INTERNAL_ERROR: { statusCode: 500, message: '服务器内部错误' },
};

module.exports = ERROR_CODES;
