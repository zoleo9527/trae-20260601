import { Module } from '@nestjs/common';
import { InMemoryStore } from './store/in-memory.store';
import { IdempotencyService } from './services/idempotency.service';
import { OperationLogService } from './services/operation-log.service';

@Module({
  providers: [InMemoryStore, IdempotencyService, OperationLogService],
  exports: [InMemoryStore, IdempotencyService, OperationLogService],
})
export class CommonModule {}
