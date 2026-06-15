import { ErrorCode } from '../enums/error-code.enum';

const ERROR_MESSAGES: Record<ErrorCode, string> = {
  [ErrorCode.SUCCESS]: '操作成功',

  [ErrorCode.AUTH_UNAUTHORIZED]: '未登录或登录已过期',
  [ErrorCode.AUTH_TOKEN_EXPIRED]: 'Token已过期',
  [ErrorCode.AUTH_INVALID_CREDENTIALS]: '用户名或密码错误',
  [ErrorCode.AUTH_FORBIDDEN]: '没有权限执行此操作',

  [ErrorCode.INTAKE_NOT_FOUND]: '接机工单不存在',
  [ErrorCode.INTAKE_STATUS_INVALID]: '工单状态不允许此操作',
  [ErrorCode.INTAKE_ALREADY_EXISTS]: '工单已存在',

  [ErrorCode.CONSENT_NOT_FOUND]: '隐私授权记录不存在',
  [ErrorCode.CONSENT_ALREADY_SIGNED]: '隐私授权已签署',
  [ErrorCode.CONSENT_INVALID_SIGNATURE]: '签名数据无效',

  [ErrorCode.VALIDATION_ERROR]: '参数校验失败',
  [ErrorCode.INTERNAL_ERROR]: '服务器内部错误',
};

export function getErrorMessage(code: ErrorCode): string {
  return ERROR_MESSAGES[code] || '未知错误';
}
