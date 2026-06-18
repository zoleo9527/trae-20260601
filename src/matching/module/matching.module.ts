import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MatchingAttempt } from '../entities/matching-attempt.entity';
import { MatchingSnapshot } from '../entities/matching-snapshot.entity';
import { MatchingService } from '../service/matching.service';
import { MatchingController } from '../controller/matching.controller';
import { HousekeeperModule } from '../../housekeeper/module/housekeeper.module';
import { IntakeModule } from '../../intake/module/intake.module';
import { AuditModule } from '../../audit/module/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([MatchingAttempt, MatchingSnapshot]),
    HousekeeperModule,
    IntakeModule,
    AuditModule,
  ],
  providers: [MatchingService],
  controllers: [MatchingController],
  exports: [MatchingService],
})
export class MatchingModule {}
