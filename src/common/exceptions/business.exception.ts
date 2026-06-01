import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode, ErrorMessage } from '../error-codes';

export class BusinessException extends HttpException {
  private readonly code: ErrorCode;
  private readonly details?: any;

  constructor(code: ErrorCode, message?: string, details?: any) {
    const msg = message || ErrorMessage[code] || '未知错误';
    super(msg, HttpStatus.BAD_REQUEST);
    this.code = code;
    this.details = details;
  }

  getCode(): ErrorCode {
    return this.code;
  }

  getDetails(): any {
    return this.details;
  }
}
