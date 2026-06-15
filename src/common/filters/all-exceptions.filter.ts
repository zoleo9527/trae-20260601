import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import { BusinessException } from '../exceptions/business.exception';
import { ErrorCode } from '../enums/error-code.enum';
import { getErrorMessage } from '../utils/error-messages';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    console.error('[EXCEPTION]', exception?.message || exception, exception?.stack || '');

    let code = ErrorCode.INTERNAL_ERROR;
    let message = getErrorMessage(ErrorCode.INTERNAL_ERROR);
    let details: any = null;
    let httpStatus = HttpStatus.INTERNAL_SERVER_ERROR;

    if (exception instanceof BusinessException) {
      code = exception.code;
      message = exception.message;
      details = exception.details;
      httpStatus = HttpStatus.OK;
    } else if (exception instanceof BadRequestException) {
      code = ErrorCode.VALIDATION_ERROR;
      const res = exception.getResponse() as any;
      message = res.message || getErrorMessage(code);
      details = res.message;
      httpStatus = HttpStatus.BAD_REQUEST;
    } else if (exception instanceof HttpException) {
      message = exception.message;
      httpStatus = exception.getStatus();
      if (httpStatus === HttpStatus.UNAUTHORIZED) {
        code = ErrorCode.AUTH_UNAUTHORIZED;
        message = getErrorMessage(code);
      } else if (httpStatus === HttpStatus.FORBIDDEN) {
        code = ErrorCode.AUTH_FORBIDDEN;
        message = getErrorMessage(code);
      }
    }

    response.status(httpStatus).json({
      code,
      message,
      data: null,
      details,
      timestamp: new Date().toISOString(),
    });
  }
}
