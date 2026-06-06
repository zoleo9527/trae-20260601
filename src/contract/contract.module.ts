import { Module } from '@nestjs/common';
import { CommonModule } from '../common/common.module';
import { NotificationModule } from '../notification/notification.module';
import { TalentModule } from '../talent/talent.module';
import { ContractController } from './contract.controller';
import { ContractService } from './contract.service';

@Module({
  imports: [CommonModule, NotificationModule, TalentModule],
  controllers: [ContractController],
  providers: [ContractService],
  exports: [ContractService],
})
export class ContractModule {}
