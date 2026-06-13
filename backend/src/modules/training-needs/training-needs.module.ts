import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrainingNeedsController } from './training-needs.controller';
import { TrainingNeedsService } from './training-needs.service';
import { TrainingNeed } from '../../entities/training-need.entity';
import { TrainingNeedRemark } from '../../entities/training-need-remark.entity';
import { User } from '../../entities/user.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { StatusHistoryModule } from '../status-history/status-history.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TrainingNeed, TrainingNeedRemark, User]),
    NotificationsModule,
    StatusHistoryModule,
  ],
  controllers: [TrainingNeedsController],
  providers: [TrainingNeedsService],
  exports: [TrainingNeedsService],
})
export class TrainingNeedsModule {}