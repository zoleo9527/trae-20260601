import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { BusinessException } from '../exceptions/business.exception';
import { ErrorCode } from '../error-codes';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let code: ErrorCode = ErrorCode.INTERNAL_ERROR;
    let message = '系统内部错误';
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let details: any = null;
    let requestId = request.headers['x-request-id'] as string;

    if (exception instanceof BusinessException) {
      code = exception.getCode();
      message = exception.message;
      status = HttpStatus.BAD_REQUEST;
      details = exception.getDetails();
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = exception.message;
      const responseData = exception.getResponse();
      if (typeof responseData === 'object' && responseData['message']) {
        message = Array.isArray(responseData['message'])
          ? responseData['message'].join(', ')
          : responseData['message'];
      }
      code = status === HttpStatus.UNAUTHORIZED ? ErrorCode.UNAUTHORIZED : ErrorCode.INVALID_PARAMETER;
    } else if (exception instanceof Error) {
      message = exception.message;
      console.error('未捕获的异常:', exception.stack);
    }

    response.status(status).json({
      code,
      message,
      data: null,
      details,
      requestId,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
