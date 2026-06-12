import { Module } from '@nestjs/common';
import { DepositService } from './deposit.service';
import { DepositController } from './deposit.controller';
import { AuditModule } from '../audit/audit.module';
import { PropertyModule } from '../property/property.module';

@Module({
  imports: [AuditModule, PropertyModule],
  controllers: [DepositController],
  providers: [DepositService],
  exports: [DepositService],
})
export class DepositModule {}
