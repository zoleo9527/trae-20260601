import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { IdempotencyService } from './idempotency.service';

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  constructor(private idempotencyService: IdempotencyService) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const idempotencyKey = request.headers['idempotency-key'];

    if (!idempotencyKey) {
      return next.handle();
    }

    const existingRecord = await this.idempotencyService.get(idempotencyKey);
    
    if (existingRecord) {
      if (existingRecord.status === 'completed') {
        return of(existingRecord.responseData);
      }
      if (existingRecord.status === 'failed') {
        await this.idempotencyService.create(idempotencyKey, request.body);
      }
    } else {
      await this.idempotencyService.create(idempotencyKey, request.body);
    }

    return next.handle().pipe(
      tap(async (response) => {
        await this.idempotencyService.update(idempotencyKey, response);
      }),
      catchError(async (error: any) => {
        await this.idempotencyService.fail(idempotencyKey, {
          error: error.message,
          statusCode: error.status || 500,
          timestamp: new Date().toISOString(),
        });
        throw error;
      }),
    );
  }
}