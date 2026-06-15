export enum ErrorCode {
  SUCCESS = 0,
  
  MEMBER_001 = 1001,
  MEMBER_002 = 1002,
  MEMBER_003 = 1003,
  MEMBER_004 = 1004,
  MEMBER_005 = 1005,
  MEMBER_006 = 1006,
  
  BABY_001 = 2001,
  BABY_002 = 2002,
  BABY_003 = 2003,
  BABY_004 = 2004,
  
  REMINDER_001 = 3001,
  REMINDER_002 = 3002,
  REMINDER_003 = 3003,
  REMINDER_004 = 3004,
  
  AUTH_001 = 4001,
  AUTH_002 = 4002,
  AUTH_003 = 4003,
  
  SYSTEM_001 = 5001,
  SYSTEM_002 = 5002,
}

export const ErrorMessage: Record<ErrorCode, string> = {
  [ErrorCode.SUCCESS]: '操作成功',
  
  [ErrorCode.MEMBER_001]: '会员手机号已存在',
  [ErrorCode.MEMBER_002]: '会员信息不完整',
  [ErrorCode.MEMBER_003]: '会员不存在',
  [ErrorCode.MEMBER_004]: '会员状态异常，无法操作',
  [ErrorCode.MEMBER_005]: '会员档案已被其他角色锁定',
  [ErrorCode.MEMBER_006]: '建档审核未通过，请修改后重新提交',
  
  [ErrorCode.BABY_001]: '宝宝信息不完整',
  [ErrorCode.BABY_002]: '宝宝出生日期无效',
  [ErrorCode.BABY_003]: '宝宝信息与会员关联失败',
  [ErrorCode.BABY_004]: '宝宝月龄计算异常',
  
  [ErrorCode.REMINDER_001]: '提醒规则不存在',
  [ErrorCode.REMINDER_002]: '提醒已处理，无法重复操作',
  [ErrorCode.REMINDER_003]: '提醒触发条件不满足',
  [ErrorCode.REMINDER_004]: '提醒回看记录不存在',
  
  [ErrorCode.AUTH_001]: '无权限访问该接口',
  [ErrorCode.AUTH_002]: '角色身份验证失败',
  [ErrorCode.AUTH_003]: '该操作需要更高级别权限',
  
  [ErrorCode.SYSTEM_001]: '系统内部错误',
  [ErrorCode.SYSTEM_002]: '数据持久化失败',
};

export class ApiException {
  constructor(
    public code: ErrorCode,
    public message?: string,
    public details?: Record<string, unknown>
  ) {
    this.message = message || ErrorMessage[code] || '未知错误';
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
      timestamp: new Date().toISOString(),
    };
  }
}

export class ApiResponse<T = unknown> {
  constructor(
    public code: ErrorCode,
    public message: string,
    public data?: T,
    public details?: Record<string, unknown>
  ) {}

  static success<T>(data?: T, message = '操作成功'): ApiResponse<T> {
    return new ApiResponse(ErrorCode.SUCCESS, message, data);
  }

  static error(
    code: ErrorCode,
    message?: string,
    details?: Record<string, unknown>
  ): ApiResponse<null> {
    return new ApiResponse(code, message || ErrorMessage[code], null, details);
  }
}