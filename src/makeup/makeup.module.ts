import { Module } from '@nestjs/common';
import { MakeupController } from './makeup.controller';
import { MakeupService } from './makeup.service';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [CommonModule],
  controllers: [MakeupController],
  providers: [MakeupService],
  exports: [MakeupService],
})
export class MakeupModule {}
