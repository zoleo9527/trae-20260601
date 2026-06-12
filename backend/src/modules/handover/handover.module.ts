import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { PropertyModule } from '../property/property.module';
import { HandoverService } from './handover.service';
import { HandoverController } from './handover.controller';

@Module({
  imports: [AuditModule, PropertyModule],
  controllers: [HandoverController],
  providers: [HandoverService],
  exports: [HandoverService],
})
export class HandoverModule {}
