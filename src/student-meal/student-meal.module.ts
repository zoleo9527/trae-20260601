import { Module } from '@nestjs/common';
import { CommonModule } from '../common/common.module';
import { StudentMealController } from './student-meal.controller';
import { StudentMealService } from './student-meal.service';

@Module({
  imports: [CommonModule],
  controllers: [StudentMealController],
  providers: [StudentMealService],
  exports: [StudentMealService],
})
export class StudentMealModule {}
