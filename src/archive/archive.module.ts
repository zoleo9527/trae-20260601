import { Module } from '@nestjs/common';
import { CommonModule } from '../common/common.module';
import { ContractModule } from '../contract/contract.module';
import { NotificationModule } from '../notification/notification.module';
import { TalentModule } from '../talent/talent.module';
import { ArchiveController } from './archive.controller';
import { ArchiveService } from './archive.service';

@Module({
  imports: [CommonModule, ContractModule, TalentModule, NotificationModule],
  controllers: [ArchiveController],
  providers: [ArchiveService],
  exports: [ArchiveService],
})
export class ArchiveModule {}
