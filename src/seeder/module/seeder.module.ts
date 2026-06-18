import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeederController } from '../controller/seeder.controller';
import { SeederService } from '../service/seeder.service';
import { Housekeeper } from '../../housekeeper/entities/housekeeper.entity';
import { Intake } from '../../intake/entities/intake.entity';
import { Order } from '../../order/entities/order.entity';
import { Review } from '../../review/review.entity';
import { MatchingAttempt } from '../../matching/entities/matching-attempt.entity';
import { MatchingSnapshot } from '../../matching/entities/matching-snapshot.entity';
import { AuditLog } from '../../audit/entities/audit-log.entity';
import { HousekeeperModule } from '../../housekeeper/module/housekeeper.module';
import { IntakeModule } from '../../intake/module/intake.module';
import { OrderModule } from '../../order/module/order.module';
import { ReviewModule } from '../../review/module/review.module';
import { MatchingModule } from '../../matching/module/matching.module';
import { AuditModule } from '../../audit/module/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Housekeeper,
      Intake,
      Order,
      Review,
      MatchingAttempt,
      MatchingSnapshot,
      AuditLog,
    ]),
    HousekeeperModule,
    IntakeModule,
    OrderModule,
    ReviewModule,
    MatchingModule,
    AuditModule,
  ],
  controllers: [SeederController],
  providers: [SeederService],
  exports: [SeederService],
})
export class SeederModule {}
