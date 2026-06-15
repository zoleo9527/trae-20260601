import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { IntakeModule } from './intake/intake.module';
import { PrivacyModule } from './privacy/privacy.module';
import { RepairModule } from './repair/repair.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { CommonModule } from './common/common.module';
import { User } from './auth/entities/user.entity';
import { IntakeOrder } from './intake/entities/intake-order.entity';
import { PrivacyConsent } from './privacy/entities/privacy-consent.entity';
import { OperationLog } from './common/entities/operation-log.entity';

@Module({
  imports: [
    CommonModule,
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'repair-shop.db',
      entities: [User, IntakeOrder, PrivacyConsent, OperationLog],
      synchronize: true,
      logging: false,
    }),
    AuthModule,
    IntakeModule,
    PrivacyModule,
    RepairModule,
    DashboardModule,
  ],
})
export class AppModule {}
