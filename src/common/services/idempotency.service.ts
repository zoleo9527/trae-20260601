import { Injectable } from '@nestjs/common';
import { IdempotentRequest } from '../interfaces';
import { InMemoryStore } from './in-memory-store.service';

@Injectable()
export class IdempotencyService {
  constructor(private readonly store: InMemoryStore) {}

  async processRequest<T>(
    requestId: string,
    resourceType: string,
    resourceId: string | undefined,
    processor: () => Promise<T>,
  ): Promise<{ result: T; isDuplicate: boolean }> {
    const existing = this.store.getIdempotentRequest(requestId);
    
    if (existing) {
      return {
        result: existing.result as T,
        isDuplicate: true,
      };
    }

    const result = await processor();

    const idempotentRequest: IdempotentRequest = {
      requestId,
      resourceType,
      resourceId,
      createdAt: new Date(),
      processedAt: new Date(),
      result,
    };

    this.store.saveIdempotentRequest(idempotentRequest);

    return {
      result,
      isDuplicate: false,
    };
  }
}
