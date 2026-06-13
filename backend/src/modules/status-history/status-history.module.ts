import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatusChangeHistory } from '../../entities/status-change-history.entity';
import { User } from '../../entities/user.entity';
import { StatusChangeHistoryService } from './status-history.service';
import { StatusHistoryController } from './status-history.controller';

@Module({
  imports: [TypeOrmModule.forFeature([StatusChangeHistory, User])],
  controllers: [StatusHistoryController],
  providers: [StatusChangeHistoryService],
  exports: [StatusChangeHistoryService],
})
export class StatusHistoryModule {}