import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Housekeeper } from '../entities/housekeeper.entity';
import { HousekeeperService } from '../service/housekeeper.service';
import { HousekeeperController } from '../controller/housekeeper.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Housekeeper])],
  providers: [HousekeeperService],
  controllers: [HousekeeperController],
  exports: [HousekeeperService],
})
export class HousekeeperModule {}
