import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { PropertyModule } from './modules/property/property.module';
import { ViewingModule } from './viewing/viewing.module';
import { HandoverModule } from './modules/handover/handover.module';
import { KeyTransferModule } from './modules/key-transfer/key-transfer.module';
import { DepositModule } from './modules/deposit/deposit.module';
import { AuditModule } from './audit/audit.module';

@Module({
  imports: [
    AuthModule,
    PropertyModule,
    ViewingModule,
    HandoverModule,
    KeyTransferModule,
    DepositModule,
    AuditModule,
  ],
})
export class AppModule {}
