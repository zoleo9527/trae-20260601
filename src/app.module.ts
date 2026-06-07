import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Staff } from './entities/staff.entity';
import { Customer } from './entities/customer.entity';
import { DeliveryRoute } from './entities/delivery-route.entity';
import { MilkChange } from './entities/milk-change.entity';
import { OperationLog } from './entities/operation-log.entity';
import { RouteAdjustHistory } from './entities/route-adjust-history.entity';
import { MilkChangeController } from './controllers/milk-change.controller';
import { MilkChangeService } from './services/milk-change.service';
import { OperationLogService } from './services/operation-log.service';
import { DataInitService } from './services/data-init.service';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'dairy.db',
      entities: [
        Staff,
        Customer,
        DeliveryRoute,
        MilkChange,
        OperationLog,
        RouteAdjustHistory,
      ],
      synchronize: true,
      logging: false,
    }),
    TypeOrmModule.forFeature([
      Staff,
      Customer,
      DeliveryRoute,
      MilkChange,
      OperationLog,
      RouteAdjustHistory,
    ]),
  ],
  controllers: [MilkChangeController],
  providers: [MilkChangeService, OperationLogService, DataInitService],
})
export class AppModule {}
