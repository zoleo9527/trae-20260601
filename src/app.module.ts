import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { PrintOrderModule } from './print-order/print-order.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { CommonModule } from './common/common.module';
import { User } from './auth/entities/user.entity';
import { OperationLog } from './common/entities/operation-log.entity';
import { PrintOrder } from './print-order/entities/print-order.entity';
import { InstallationAssignment } from './print-order/entities/installation-assignment.entity';
import { PhotoReturn } from './print-order/entities/photo-return.entity';
import { OrderNote } from './print-order/entities/order-note.entity';
import { InstallationTask } from './print-order/entities/installation-task.entity';

@Module({
  imports: [
    CommonModule,
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'print-shop.db',
      entities: [
        User,
        OperationLog,
        PrintOrder,
        InstallationAssignment,
        PhotoReturn,
        OrderNote,
        InstallationTask,
      ],
      synchronize: true,
      logging: false,
    }),
    AuthModule,
    PrintOrderModule,
    DashboardModule,
  ],
})
export class AppModule {}
