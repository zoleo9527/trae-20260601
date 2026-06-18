import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from './audit/module/audit.module';
import { IntakeModule } from './intake/module/intake.module';
import { HousekeeperModule } from './housekeeper/module/housekeeper.module';
import { MatchingModule } from './matching/module/matching.module';
import { OrderModule } from './order/module/order.module';
import { ReviewModule } from './review/module/review.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { SeederModule } from './seeder/module/seeder.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'data/hms.db',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true,
      logging: false,
    }),
    AuditModule,
    IntakeModule,
    HousekeeperModule,
    MatchingModule,
    OrderModule,
    ReviewModule,
    DashboardModule,
    SeederModule,
  ],
})
export class AppModule {}
