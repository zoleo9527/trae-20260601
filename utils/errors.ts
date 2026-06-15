export const ERROR_CODES = {
  APPEAL_NOT_FOUND: 'APPEAL_001',
  EVIDENCE_UPLOAD_FAILED: 'EVIDENCE_001',
  INVALID_STATUS_TRANSITION: 'STATUS_001',
  ROLE_PERMISSION_DENIED: 'PERMISSION_001',
  DEADLINE_EXCEEDED: 'TIMEOUT_001',
  INTERNAL_ERROR: 'INTERNAL_001',
  METHOD_NOT_ALLOWED: 'METHOD_001',
} as const;

export type ErrorCodeKey = keyof typeof ERROR_CODES;

export const ERROR_MESSAGES: Record<ErrorCodeKey, string> = {
  APPEAL_NOT_FOUND: '申诉不存在',
  EVIDENCE_UPLOAD_FAILED: '证据上传失败',
  INVALID_STATUS_TRANSITION: '状态转换无效',
  ROLE_PERMISSION_DENIED: '当前角色无权执行此操作',
  DEADLINE_EXCEEDED: '已超过处理期限',
  INTERNAL_ERROR: '服务器内部错误',
  METHOD_NOT_ALLOWED: '请求方法不允许',
};

export const getErrorResponse = (code: ErrorCodeKey, customMessage?: string) => {
  return {
    success: false,
    error: {
      code: ERROR_CODES[code],
      message: customMessage || ERROR_MESSAGES[code],
    },
  };
};

export const createErrorResponse = (code: ErrorCodeKey, message?: string) => {
  const response = getErrorResponse(code, message);
  const statusCodes: Record<ErrorCodeKey, number> = {
    APPEAL_NOT_FOUND: 404,
    EVIDENCE_UPLOAD_FAILED: 400,
    INVALID_STATUS_TRANSITION: 400,
    ROLE_PERMISSION_DENIED: 403,
    DEADLINE_EXCEEDED: 400,
    INTERNAL_ERROR: 500,
    METHOD_NOT_ALLOWED: 405,
  };
  return {
    status: statusCodes[code],
    body: response,
  };
};