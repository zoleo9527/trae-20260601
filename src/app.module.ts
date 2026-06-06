import { Module } from '@nestjs/common';
import { ArchiveModule } from './archive/archive.module';
import { CommonModule } from './common/common.module';
import { ContractModule } from './contract/contract.module';
import { NotificationModule } from './notification/notification.module';
import { RoleEntranceModule } from './role-entrance/role-entrance.module';
import { SeedModule } from './seed/seed.module';
import { TalentModule } from './talent/talent.module';

@Module({
  imports: [
    CommonModule,
    TalentModule,
    ContractModule,
    ArchiveModule,
    SeedModule,
    NotificationModule,
    RoleEntranceModule,
  ],
})
export class AppModule {}
