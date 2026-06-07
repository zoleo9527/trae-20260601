import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MilkChange } from '../entities/milk-change.entity';
import { Customer } from '../entities/customer.entity';
import { Staff } from '../entities/staff.entity';
import { DeliveryRoute } from '../entities/delivery-route.entity';
import { OperationLog } from '../entities/operation-log.entity';
import { RouteAdjustHistory } from '../entities/route-adjust-history.entity';
import { MilkChangeService } from '../services/milk-change.service';
import { OperationLogService } from '../services/operation-log.service';
import { MilkChangeController } from '../controllers/milk-change.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MilkChange,
      Customer,
      Staff,
      DeliveryRoute,
      OperationLog,
      RouteAdjustHistory,
    ]),
  ],
  controllers: [MilkChangeController],
  providers: [MilkChangeService, OperationLogService],
  exports: [MilkChangeService],
})
export class MilkChangeModule {}
