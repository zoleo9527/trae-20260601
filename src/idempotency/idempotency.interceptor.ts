
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
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

    const existingResponse = await this.idempotencyService.get(idempotencyKey);
    
    if (existingResponse) {
      return of(existingResponse);
    }

    await this.idempotencyService.create(idempotencyKey, request.body);

    return next.handle().pipe(
      tap(async (response) => {
        await this.idempotencyService.update(idempotencyKey, response);
      }),
    );
  }
}
