import { ErrorCode, ErrorMessage } from './error-code';

export class BusinessException extends Error {
  code: ErrorCode;
  message: string;

  constructor(code: ErrorCode, message?: string) {
    super(message || ErrorMessage[code]);
    this.code = code;
    this.message = message || ErrorMessage[code];
    this.name = 'BusinessException';
  }
}
