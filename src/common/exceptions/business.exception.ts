import { ErrorCode } from '../enums/error-code.enum';
import { getErrorMessage } from '../utils/error-messages';

export class BusinessException extends Error {
  public readonly details?: any;
  public readonly code: ErrorCode;

  constructor(
    code: ErrorCode,
    message?: string,
    details?: any,
  ) {
    super(message || getErrorMessage(code));
    this.code = code;
    this.details = details;
    this.name = 'BusinessException';
  }
}
