import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PrintOrderService } from './print-order.service';
import { PrintOrderController } from './print-order.controller';
import { PrintOrder } from './entities/print-order.entity';
import { InstallationAssignment } from './entities/installation-assignment.entity';
import { PhotoReturn } from './entities/photo-return.entity';
import { OrderNote } from './entities/order-note.entity';
import { InstallationTask } from './entities/installation-task.entity';
import { User } from '../auth/entities/user.entity';
import { CommonModule } from '../common/common.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PrintOrder,
      InstallationAssignment,
      PhotoReturn,
      OrderNote,
      InstallationTask,
      User,
    ]),
    CommonModule,
    forwardRef(() => AuthModule),
  ],
  controllers: [PrintOrderController],
  providers: [PrintOrderService],
  exports: [PrintOrderService, TypeOrmModule],
})
export class PrintOrderModule {}
