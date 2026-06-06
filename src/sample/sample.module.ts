import { Module } from '@nestjs/common';
import { CommonModule } from '../common/common.module';
import { SampleController } from './sample.controller';
import { SampleService } from './sample.service';

@Module({
  imports: [CommonModule],
  controllers: [SampleController],
  providers: [SampleService],
  exports: [SampleService],
})
export class SampleModule {}
