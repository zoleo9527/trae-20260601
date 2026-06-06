import { Response } from 'express';
import { ErrorCode, ErrorMessage } from './errorCode';

export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

export function success<T>(data: T, message: string = ErrorMessage[ErrorCode.SUCCESS]): ApiResponse<T> {
  return {
    code: ErrorCode.SUCCESS,
    message,
    data,
  };
}

export function fail(code: ErrorCode, message?: string, data?: any): ApiResponse {
  return {
    code,
    message: message || ErrorMessage[code],
    data: data || null,
  };
}

export function sendSuccess<T>(res: Response, data: T, message?: string): void {
  res.json(success(data, message));
}

export function sendFail(res: Response, code: ErrorCode, message?: string, data?: any): void {
  res.status(200).json(fail(code, message, data));
}
