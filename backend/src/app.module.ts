import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { PropertyModule } from './modules/property/property.module';
import { ViewingModule } from './modules/viewing/viewing.module';
import { HandoverModule } from './modules/handover/handover.module';
import { KeyTransferModule } from './modules/key-transfer/key-transfer.module';
import { DepositModule } from './modules/deposit/deposit.module';
import { AuditModule } from './modules/audit/audit.module';
import { OverviewModule } from './modules/overview/overview.module';

@Module({
  imports: [
    AuthModule,
    PropertyModule,
    ViewingModule,
    HandoverModule,
    KeyTransferModule,
    DepositModule,
    AuditModule,
    OverviewModule,
  ],
})
export class AppModule {}
