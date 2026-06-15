import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { PrintOrder } from '../print-order/entities/print-order.entity';
import { OperationLog } from '../common/entities/operation-log.entity';
import { User } from '../auth/entities/user.entity';
import { InstallationTask } from '../print-order/entities/installation-task.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PrintOrder, OperationLog, User, InstallationTask])],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
