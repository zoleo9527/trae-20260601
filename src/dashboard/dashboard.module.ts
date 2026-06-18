import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { Intake } from '../intake/entities/intake.entity';
import { Order } from '../order/entities/order.entity';
import { Review } from '../review/review.entity';
import { MatchingAttempt } from '../matching/entities/matching-attempt.entity';
import { IntakeModule } from '../intake/module/intake.module';
import { MatchingModule } from '../matching/module/matching.module';
import { OrderModule } from '../order/module/order.module';
import { ReviewModule } from '../review/module/review.module';
import { AuditModule } from '../audit/module/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Intake, Order, Review, MatchingAttempt]),
    IntakeModule,
    MatchingModule,
    OrderModule,
    ReviewModule,
    AuditModule,
  ],
  providers: [DashboardService],
  controllers: [DashboardController],
  exports: [DashboardService],
})
export class DashboardModule {}
