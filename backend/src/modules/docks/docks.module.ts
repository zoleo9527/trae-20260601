import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocksService } from './docks.service';
import { DocksController } from './docks.controller';
import { Dock } from '../../entities/dock.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Dock])],
  providers: [DocksService],
  controllers: [DocksController],
})
export class DocksModule {}
