import { ErrorCode, ErrorMessage } from './error-code';

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
    return new ApiResponse<T>(ErrorCode.SUCCESS, ErrorMessage[ErrorCode.SUCCESS], data);
  }

  static error(code: ErrorCode, message?: string): ApiResponse<null> {
    return new ApiResponse<null>(code, message || ErrorMessage[code] || '未知错误', null);
  }
}
