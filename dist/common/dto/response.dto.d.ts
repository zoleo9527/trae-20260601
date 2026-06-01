import { ErrorCode } from '../error-codes';
export declare class ApiResponse<T> {
    code: ErrorCode;
    message: string;
    data: T;
    requestId: string;
    timestamp: string;
    static success<T>(data: T, requestId?: string): ApiResponse<T>;
    static error(code: ErrorCode, message: string, requestId?: string): ApiResponse<null>;
}
