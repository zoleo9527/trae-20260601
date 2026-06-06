import { Module } from '@nestjs/common';
import { ArchiveModule } from '../archive/archive.module';
import { CommonModule } from '../common/common.module';
import { ContractModule } from '../contract/contract.module';
import { RoleEntranceController } from './role-entrance.controller';

@Module({
  imports: [CommonModule, ContractModule, ArchiveModule],
  controllers: [RoleEntranceController],
})
export class RoleEntranceModule {}
