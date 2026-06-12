import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from '../../entities/task.entity';
import { Order } from '../../entities/order.entity';
import { TaskService } from './task.service';
import { TaskWorkflowService } from './task-workflow.service';
import { TaskController } from './task.controller';
import { TaskWorkflowController } from './task-workflow.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Task, Order])],
  providers: [TaskService, TaskWorkflowService],
  controllers: [TaskController, TaskWorkflowController],
  exports: [TaskService, TaskWorkflowService],
})
export class TaskModule {}