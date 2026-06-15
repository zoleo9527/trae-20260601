import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ErrorCode } from '../enums/error-code.enum';
import { getErrorMessage } from '../utils/error-messages';

@Injectable()
export class ResponseTransformInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => ({
        code: ErrorCode.SUCCESS,
        message: getErrorMessage(ErrorCode.SUCCESS),
        data,
        timestamp: new Date().toISOString(),
      })),
    );
  }
}
