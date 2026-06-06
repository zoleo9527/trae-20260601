export enum ErrorCode {
  SUCCESS = 0,
  
  PARAM_ERROR = 10001,
  PARAM_MISSING = 10002,
  PARAM_INVALID = 10003,
  
  USER_NOT_FOUND = 20001,
  USER_ROLE_INVALID = 20002,
  
  ORDER_NOT_FOUND = 30001,
  ORDER_STATUS_INVALID = 30002,
  ORDER_NO_EXISTS = 30003,
  
  MATERIAL_ALREADY_REGISTERED = 40001,
  FEE_ALREADY_REGISTERED = 50001,
  
  PERMISSION_DENIED = 60001,
  OPERATION_NOT_ALLOWED = 60002,
  
  INTERNAL_ERROR = 99999,
}

export const ErrorMessage: Record<ErrorCode, string> = {
  [ErrorCode.SUCCESS]: '成功',
  
  [ErrorCode.PARAM_ERROR]: '参数错误',
  [ErrorCode.PARAM_MISSING]: '缺少必要参数',
  [ErrorCode.PARAM_INVALID]: '参数格式无效',
  
  [ErrorCode.USER_NOT_FOUND]: '用户不存在',
  [ErrorCode.USER_ROLE_INVALID]: '用户角色无效',
  
  [ErrorCode.ORDER_NOT_FOUND]: '维修工单不存在',
  [ErrorCode.ORDER_STATUS_INVALID]: '工单状态不支持该操作',
  [ErrorCode.ORDER_NO_EXISTS]: '工单编号已存在',
  
  [ErrorCode.MATERIAL_ALREADY_REGISTERED]: '材料已登记，无法重复登记',
  [ErrorCode.FEE_ALREADY_REGISTERED]: '费用已登记，无法重复登记',
  
  [ErrorCode.PERMISSION_DENIED]: '权限不足',
  [ErrorCode.OPERATION_NOT_ALLOWED]: '当前状态不允许该操作',
  
  [ErrorCode.INTERNAL_ERROR]: '服务器内部错误',
};

export class BusinessError extends Error {
  code: ErrorCode;
  message: string;
  data?: any;

  constructor(code: ErrorCode, message?: string, data?: any) {
    super(message || ErrorMessage[code]);
    this.code = code;
    this.message = message || ErrorMessage[code];
    this.data = data;
    this.name = 'BusinessError';
  }
}
