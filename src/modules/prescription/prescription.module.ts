import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Prescription } from './prescription.entity';
import { PrescriptionStateMachine } from './prescription.state-machine';
import { PrescriptionService } from './prescription.service';
import { PrescriptionController } from './prescription.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Prescription])],
  controllers: [PrescriptionController],
  providers: [PrescriptionService, PrescriptionStateMachine],
  exports: [PrescriptionService, PrescriptionStateMachine],
})
export class PrescriptionModule {}
