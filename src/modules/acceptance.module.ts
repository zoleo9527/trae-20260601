import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Installation } from '../entities/installation.entity';
import { InstallationRecord } from '../entities/installation-record.entity';
import { Photo } from '../entities/photo.entity';
import { AcceptanceService } from '../services/acceptance.service';
import { AcceptanceController } from '../controllers/acceptance.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Installation, InstallationRecord, Photo])],
  providers: [AcceptanceService],
  controllers: [AcceptanceController],
  exports: [AcceptanceService],
})
export class AcceptanceModule {}
