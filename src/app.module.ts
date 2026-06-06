import { Module } from '@nestjs/common';
import { CommonModule } from './common/common.module';
import { RepairModule } from './repair/repair.module';
import { DispatchModule } from './dispatch/dispatch.module';
import { MaintenanceModule } from './maintenance/maintenance.module';
import { RoleEntranceModule } from './role-entrance/role-entrance.module';
import { SeedModule } from './seed/seed.module';

@Module({
  imports: [
    CommonModule,
    RepairModule,
    DispatchModule,
    MaintenanceModule,
    RoleEntranceModule,
    SeedModule,
  ],
})
export class AppModule {}
