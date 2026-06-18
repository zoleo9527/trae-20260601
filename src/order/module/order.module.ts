import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '../entities/order.entity';
import { OrderService } from '../service/order.service';
import { OrderController } from '../controller/order.controller';
import { HousekeeperModule } from '../../housekeeper/module/housekeeper.module';
import { AuditModule } from '../../audit/module/audit.module';
import { IntakeModule } from '../../intake/module/intake.module';

@Module({
  imports: [TypeOrmModule.forFeature([Order]), HousekeeperModule, AuditModule, IntakeModule],
  providers: [OrderService],
  controllers: [OrderController],
  exports: [OrderService],
})
export class OrderModule {}
