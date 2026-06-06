import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Staff } from './entities/staff.entity';
import { Student } from './entities/student.entity';
import { Bed } from './entities/bed.entity';
import { CheckInAssignment } from './entities/check-in-assignment.entity';
import { BedAdjustment } from './entities/bed-adjustment.entity';
import { OperationLog } from './entities/operation-log.entity';
import { CheckInController } from './controllers/check-in.controller';
import { BedAdjustmentController } from './controllers/bed-adjustment.controller';
import { OverviewController } from './controllers/overview.controller';
import { CheckInService } from './services/check-in.service';
import { BedAdjustmentService } from './services/bed-adjustment.service';
import { OperationLogService } from './services/operation-log.service';
import { DataInitService } from './services/data-init.service';
import { OverviewService } from './services/overview.service';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'dormitory.db',
      entities: [Staff, Student, Bed, CheckInAssignment, BedAdjustment, OperationLog],
      synchronize: true,
      logging: false,
    }),
    TypeOrmModule.forFeature([Staff, Student, Bed, CheckInAssignment, BedAdjustment, OperationLog]),
  ],
  controllers: [CheckInController, BedAdjustmentController, OverviewController],
  providers: [CheckInService, BedAdjustmentService, OperationLogService, DataInitService, OverviewService],
})
export class AppModule {}
