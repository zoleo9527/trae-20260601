import { Module } from '@nestjs/common';
import { OverviewService } from './overview.service';
import { OverviewController } from './overview.controller';
import { PropertyModule } from '../property/property.module';
import { ViewingModule } from '../viewing/viewing.module';
import { HandoverModule } from '../handover/handover.module';
import { KeyTransferModule } from '../key-transfer/key-transfer.module';
import { DepositModule } from '../deposit/deposit.module';

@Module({
  imports: [
    PropertyModule,
    ViewingModule,
    HandoverModule,
    KeyTransferModule,
    DepositModule,
  ],
  controllers: [OverviewController],
  providers: [OverviewService],
  exports: [OverviewService],
})
export class OverviewModule {}
