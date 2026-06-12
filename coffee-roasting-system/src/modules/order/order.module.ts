import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '../../entities/order.entity';
import { Task } from '../../entities/task.entity';
import { Note } from '../../entities/note.entity';
import { User } from '../../entities/user.entity';
import { OrderService } from './order.service';
import { OrderDetailService } from './order-detail.service';
import { OrderController } from './order.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Order, Task, Note, User])],
  providers: [OrderService, OrderDetailService],
  controllers: [OrderController],
  exports: [OrderService, OrderDetailService],
})
export class OrderModule {}
