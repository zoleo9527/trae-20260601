import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiException, ApiResponse, ErrorCode } from '../common/error-code';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof ApiException) {
      const apiException = exception as ApiException;
      response.status(HttpStatus.BAD_REQUEST).json(apiException.toJSON());
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      response.status(status).json({
        code: ErrorCode.SYSTEM_001,
        message:
          typeof exceptionResponse === 'string'
            ? exceptionResponse
            : (exceptionResponse as any).message || '请求处理失败',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    console.error('未处理的异常:', exception);

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      code: ErrorCode.SYSTEM_001,
      message: '系统内部错误',
      timestamp: new Date().toISOString(),
    });
  }
}