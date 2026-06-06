import { Module } from '@nestjs/common';
import { CommonModule } from '../common/common.module';
import { TalentController } from './talent.controller';
import { TalentService } from './talent.service';

@Module({
  imports: [CommonModule],
  controllers: [TalentController],
  providers: [TalentService],
  exports: [TalentService],
})
export class TalentModule {}
