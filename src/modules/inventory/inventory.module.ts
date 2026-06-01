import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { MedicineInventory } from './entities/medicine-inventory.entity';
import { NearExpiryAlert } from './entities/near-expiry-alert.entity';
import { AlertStateMachine } from './alert.state-machine';

@Module({
  imports: [TypeOrmModule.forFeature([MedicineInventory, NearExpiryAlert])],
  controllers: [InventoryController],
  providers: [InventoryService, AlertStateMachine],
  exports: [InventoryService, AlertStateMachine],
})
export class InventoryModule {}
