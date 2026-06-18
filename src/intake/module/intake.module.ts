import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Intake } from '../entities/intake.entity';
import { IntakeService } from '../service/intake.service';
import { IntakeController } from '../controller/intake.controller';
import { AuditModule } from '../../audit/module/audit.module';

@Module({
  imports: [TypeOrmModule.forFeature([Intake]), AuditModule],
  controllers: [IntakeController],
  providers: [IntakeService],
  exports: [IntakeService],
})
export class IntakeModule {}
