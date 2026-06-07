import { ErrorCode } from './error-code';

export class ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;

  constructor(code: number, message: string, data?: T) {
    this.code = code;
    this.message = message;
    this.data = data;
  }

  static success<T>(data?: T): ApiResponse<T> {
    return new ApiResponse<T>(ErrorCode.SUCCESS, '成功', data);
  }

  static error(code: ErrorCode, message?: string): ApiResponse<null> {
    return new ApiResponse<null>(
      code,
      message || '操作失败',
      null
    );
  }
}
