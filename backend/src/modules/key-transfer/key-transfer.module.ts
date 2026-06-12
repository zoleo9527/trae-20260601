import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { HandoverModule } from '../handover/handover.module';
import { PropertyModule } from '../property/property.module';
import { KeyTransferService } from './key-transfer.service';
import { KeyTransferController } from './key-transfer.controller';

@Module({
  imports: [AuditModule, HandoverModule, PropertyModule],
  controllers: [KeyTransferController],
  providers: [KeyTransferService],
  exports: [KeyTransferService],
})
export class KeyTransferModule {}
