import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Installation } from '../entities/installation.entity';
import { InstallationRecord } from '../entities/installation-record.entity';
import { InstallationService } from '../services/installation.service';
import { InstallationController } from '../controllers/installation.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Installation, InstallationRecord])],
  providers: [InstallationService],
  controllers: [InstallationController],
  exports: [InstallationService],
})
export class InstallationModule {}
