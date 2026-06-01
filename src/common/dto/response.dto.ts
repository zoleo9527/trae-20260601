import { ErrorCode } from '../error-codes';

export class ApiResponse<T> {
  code: ErrorCode;
  message: string;
  data: T;
  requestId: string;
  timestamp: string;

  static success<T>(data: T, requestId?: string): ApiResponse<T> {
    return {
      code: ErrorCode.SUCCESS,
      message: '操作成功',
      data,
      requestId: requestId || '',
      timestamp: new Date().toISOString(),
    };
  }

  static error(code: ErrorCode, message: string, requestId?: string): ApiResponse<null> {
    return {
      code,
      message,
      data: null,
      requestId: requestId || '',
      timestamp: new Date().toISOString(),
    };
  }
}
