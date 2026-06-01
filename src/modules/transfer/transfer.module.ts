import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransferService } from './transfer.service';
import { TransferController } from './transfer.controller';
import { TransferOrder } from './entities/transfer-order.entity';
import { TransferStateMachine } from './state-machine/transfer.state-machine';
import { InventoryModule } from '../inventory/inventory.module';

@Module({
  imports: [TypeOrmModule.forFeature([TransferOrder]), InventoryModule],
  controllers: [TransferController],
  providers: [TransferService, TransferStateMachine],
  exports: [TransferService],
})
export class TransferModule {}
