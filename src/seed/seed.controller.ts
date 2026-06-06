import { Controller, Delete, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SeedService } from './seed.service';

@ApiTags('seed')
@Controller('seed')
export class SeedController {
  constructor(private readonly seedService: SeedService) {}

  @Post()
  @ApiOperation({ summary: '初始化种子数据（学校食堂订餐系统非满状态样例）' })
  seed() {
    return this.seedService.seed();
  }

  @Delete()
  @ApiOperation({ summary: '清空所有数据' })
  clear() {
    return this.seedService.clear();
  }
}
