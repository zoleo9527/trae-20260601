import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IntakeController } from './intake.controller';
import { IntakeService } from './intake.service';
import { IntakeOrder } from './entities/intake-order.entity';
import { PrivacyConsent } from '../privacy/entities/privacy-consent.entity';
import { User } from '../auth/entities/user.entity';
import { CommonModule } from '../common/common.module';
import { RepairModule } from '../repair/repair.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([IntakeOrder, PrivacyConsent, User]),
    CommonModule,
    forwardRef(() => RepairModule),
  ],
  controllers: [IntakeController],
  providers: [IntakeService],
  exports: [IntakeService],
})
export class IntakeModule {}
