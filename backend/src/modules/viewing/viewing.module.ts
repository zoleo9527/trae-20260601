import { Module } from '@nestjs/common';
import { ViewingService } from './viewing.service';
import { ViewingController } from './viewing.controller';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [ViewingController],
  providers: [ViewingService],
})
export class ViewingModule {}
