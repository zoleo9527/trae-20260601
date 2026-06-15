import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RepairController } from './repair.controller';
import { RepairService } from './repair.service';
import { IntakeOrder } from '../intake/entities/intake-order.entity';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [TypeOrmModule.forFeature([IntakeOrder]), CommonModule],
  controllers: [RepairController],
  providers: [RepairService],
  exports: [RepairService],
})
export class RepairModule {}
