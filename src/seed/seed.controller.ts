import { Controller, Post } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SeedService } from './seed.service';

@ApiTags('seed')
@Controller('api/seed')
export class SeedController {
  constructor(private readonly seedService: SeedService) {}

  @Post('reset')
  @ApiOperation({ summary: '重置种子数据' })
  async reset() {
    return this.seedService.reset();
  }
}
