import { HttpException } from '@nestjs/common';
import { ErrorCode } from '../error-codes';
export declare class BusinessException extends HttpException {
    private readonly code;
    private readonly details?;
    constructor(code: ErrorCode, message?: string, details?: any);
    getCode(): ErrorCode;
    getDetails(): any;
}
