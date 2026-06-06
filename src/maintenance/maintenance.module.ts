import { Module } from '@nestjs/common';
import { MaintenanceController } from './maintenance.controller';
import { MaintenanceService } from './maintenance.service';
import { RepairModule } from '../repair/repair.module';
import { DispatchModule } from '../dispatch/dispatch.module';

@Module({
  imports: [RepairModule, DispatchModule],
  controllers: [MaintenanceController],
  providers: [MaintenanceService],
  exports: [MaintenanceService],
})
export class MaintenanceModule {}
