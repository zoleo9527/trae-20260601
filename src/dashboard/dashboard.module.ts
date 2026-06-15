import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { IntakeOrder } from '../intake/entities/intake-order.entity';
import { OperationLog } from '../common/entities/operation-log.entity';
import { PrivacyConsent } from '../privacy/entities/privacy-consent.entity';
import { User } from '../auth/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([IntakeOrder, OperationLog, PrivacyConsent, User])],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
