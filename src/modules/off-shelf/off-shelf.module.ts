import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { OffShelfService } from './off-shelf.service';
import { OffShelfController } from './off-shelf.controller';
import { OffShelfOrder } from './entities/off-shelf-order.entity';
import { OffShelfStateMachine } from './state-machine/off-shelf.state-machine';
import { MedicineInventory } from '../inventory/entities/medicine-inventory.entity';
import { NearExpiryAlert } from '../inventory/entities/near-expiry-alert.entity';

@Module({
  imports: [TypeOrmModule.forFeature([OffShelfOrder, MedicineInventory, NearExpiryAlert])],
  controllers: [OffShelfController],
  providers: [OffShelfService, OffShelfStateMachine],
  exports: [OffShelfService, OffShelfStateMachine],
})
export class OffShelfModule {}
