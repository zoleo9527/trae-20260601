import { Module } from '@nestjs/common';
import { CommonModule } from '../common/common.module';
import { PurchaseModule } from '../purchase/purchase.module';
import { SpecialMealModule } from '../special-meal/special-meal.module';
import { StudentMealModule } from '../student-meal/student-meal.module';
import { TimelineModule } from '../timeline/timeline.module';
import { RoleEntranceController } from './role-entrance.controller';

@Module({
  imports: [CommonModule, StudentMealModule, SpecialMealModule, PurchaseModule, TimelineModule],
  controllers: [RoleEntranceController],
})
export class RoleEntranceModule {}
