import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Review } from '../review.entity';
import { ReviewService } from '../service/review.service';
import { ReviewController } from '../controller/review.controller';
import { AuditModule } from '../../audit/module/audit.module';
import { HousekeeperModule } from '../../housekeeper/module/housekeeper.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Review]),
    AuditModule,
    HousekeeperModule,
  ],
  providers: [ReviewService],
  controllers: [ReviewController],
  exports: [ReviewService],
})
export class ReviewModule {}
