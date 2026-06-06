import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { Response } from 'express';
import { ApiResponse } from './response';
import { ErrorCode } from './error-code';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    let code = ErrorCode.INTERNAL_ERROR;
    let message = exception.message;

    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const res = exceptionResponse as any;
      if (res.statusCode === 400 && Array.isArray(res.message)) {
        code = ErrorCode.PARAM_VALIDATION_ERROR;
        message = res.message.join('; ');
      } else if (res.message) {
        message = res.message;
      }
    }

    if (status >= 400 && status < 500 && code === ErrorCode.INTERNAL_ERROR) {
      code = status;
    }

    const apiResponse = ApiResponse.error(code, message);
    response.status(200).json(apiResponse);
  }
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let message = '系统内部错误';
    if (exception instanceof Error) {
      message = exception.message;
    }

    const apiResponse = ApiResponse.error(ErrorCode.INTERNAL_ERROR, message);
    response.status(200).json(apiResponse);
  }
}
