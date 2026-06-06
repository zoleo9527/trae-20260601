import { Module } from '@nestjs/common';
import { CommonModule } from '../common/common.module';
import { StudentMealModule } from '../student-meal/student-meal.module';
import { PurchaseController } from './purchase.controller';
import { PurchaseService } from './purchase.service';

@Module({
  imports: [CommonModule, StudentMealModule],
  controllers: [PurchaseController],
  providers: [PurchaseService],
  exports: [PurchaseService],
})
export class PurchaseModule {}
