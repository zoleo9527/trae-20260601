import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { UserContextMiddleware } from './middleware/user-context.middleware';
import { IdempotencyService } from './services/idempotency.service';
import { InMemoryStore } from './services/in-memory-store.service';

@Module({
  providers: [InMemoryStore, IdempotencyService],
  exports: [InMemoryStore, IdempotencyService],
})
export class CommonModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(UserContextMiddleware).forRoutes('*');
  }
}
