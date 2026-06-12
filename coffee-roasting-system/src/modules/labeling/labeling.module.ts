import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from '../../entities/task.entity';
import { Order } from '../../entities/order.entity';
import { Note } from '../../entities/note.entity';
import { LabelingHistoryService } from './labeling-history.service';
import { LabelingHistoryController } from './labeling-history.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Task, Order, Note])],
  providers: [LabelingHistoryService],
  controllers: [LabelingHistoryController],
})
export class LabelingModule {}
