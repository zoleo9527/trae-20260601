import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../entities/user.entity';
import { Order } from '../../entities/order.entity';
import { Task } from '../../entities/task.entity';
import { Note } from '../../entities/note.entity';
import { SeedService } from './seed.service';
import { SeedController } from './seed.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User, Order, Task, Note])],
  providers: [SeedService],
  controllers: [SeedController],
})
export class SeedModule {}
