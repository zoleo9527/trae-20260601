import { Module } from '@nestjs/common';
import { CommonModule } from './common/common.module';
import { NotificationModule } from './notification/notification.module';
import { PurchaseModule } from './purchase/purchase.module';
import { RoleEntranceModule } from './role-entrance/role-entrance.module';
import { SampleModule } from './sample/sample.module';
import { SeedModule } from './seed/seed.module';
import { SpecialMealModule } from './special-meal/special-meal.module';
import { StudentMealModule } from './student-meal/student-meal.module';
import { TimelineModule } from './timeline/timeline.module';

@Module({
  imports: [
    CommonModule,
    StudentMealModule,
    SpecialMealModule,
    PurchaseModule,
    SampleModule,
    TimelineModule,
    SeedModule,
    NotificationModule,
    RoleEntranceModule,
  ],
})
export class AppModule {}
