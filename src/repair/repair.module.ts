import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RepairController } from './repair.controller';
import { EvidenceController } from './evidence.controller';
import { RepairService } from './repair.service';
import { EvidenceService } from './evidence.service';
import { IntakeOrder } from '../intake/entities/intake-order.entity';
import { PartRequest } from './entities/part-request.entity';
import { QualityCheckRecord } from './entities/quality-check.entity';
import { Attachment } from './entities/attachment.entity';
import { CommonModule } from '../common/common.module';
import { IntakeModule } from '../intake/intake.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      IntakeOrder,
      PartRequest,
      QualityCheckRecord,
      Attachment,
    ]),
    CommonModule,
    forwardRef(() => IntakeModule),
  ],
  controllers: [RepairController, EvidenceController],
  providers: [RepairService, EvidenceService],
  exports: [RepairService, EvidenceService],
})
export class RepairModule {}
