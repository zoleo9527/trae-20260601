import { Module } from '@nestjs/common';
import { CommonModule } from '../common/common.module';
import { SpecialMealController } from './special-meal.controller';
import { SpecialMealService } from './special-meal.service';

@Module({
  imports: [CommonModule],
  controllers: [SpecialMealController],
  providers: [SpecialMealService],
  exports: [SpecialMealService],
})
export class SpecialMealModule {}
