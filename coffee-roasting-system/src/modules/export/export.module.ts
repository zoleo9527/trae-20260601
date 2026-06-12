import { Module } from '@nestjs/common';
import { ExportService } from './export.service';
import { ExportController } from './export.controller';
import { OrderModule } from '../order/order.module';
import { TaskModule } from '../task/task.module';

@Module({
  imports: [OrderModule, TaskModule],
  providers: [ExportService],
  controllers: [ExportController],
})
export class ExportModule {}
