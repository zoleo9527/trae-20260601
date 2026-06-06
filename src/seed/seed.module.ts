import { Module } from '@nestjs/common';
import { ArchiveModule } from '../archive/archive.module';
import { CommonModule } from '../common/common.module';
import { ContractModule } from '../contract/contract.module';
import { TalentModule } from '../talent/talent.module';
import { SeedController } from './seed.controller';
import { SeedService } from './seed.service';

@Module({
  imports: [CommonModule, TalentModule, ContractModule, ArchiveModule],
  controllers: [SeedController],
  providers: [SeedService],
})
export class SeedModule {}
