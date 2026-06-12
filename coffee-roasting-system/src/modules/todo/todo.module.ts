import { Module } from '@nestjs/common';
import { TodoService } from './todo.service';
import { TodoController } from './todo.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from '../../entities/task.entity';
import { Order } from '../../entities/order.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Task, Order])],
  providers: [TodoService],
  controllers: [TodoController],
})
export class TodoModule {}
