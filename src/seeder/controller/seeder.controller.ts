import { Controller, Get, Post, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SeederService } from '../service/seeder.service';

@ApiTags('种子数据 Seeder')
@Controller('seeder')
export class SeederController {
  constructor(private readonly svc: SeederService) {}

  @Post('seed')
  @ApiOperation({ summary: '初始化种子数据（清空旧数据后重新创建）' })
  seed() {
    return this.svc.seed();
  }

  @Delete('clear')
  @ApiOperation({ summary: '清空所有数据' })
  clearAll() {
    return this.svc.clearAll();
  }

  @Get('summary')
  @ApiOperation({ summary: '获取当前数据统计' })
  summary() {
    return this.svc.getSeedSummary();
  }
}
