import { Module } from '@nestjs/common';
import { CommonModule } from '../common/common.module';
import { SeedController } from './seed.controller';
import { SeedService } from './seed.service';

@Module({
  imports: [CommonModule],
  controllers: [SeedController],
  providers: [SeedService],
})
export class SeedModule {}
