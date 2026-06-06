import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CreateSampleDto } from './interfaces/sample.interface';
import { SampleService } from './sample.service';

@ApiTags('sample')
@Controller('sample')
export class SampleController {
  constructor(private readonly sampleService: SampleService) {}

  @Get()
  @ApiOperation({ summary: '获取留样记录列表' })
  @ApiQuery({ name: 'date', required: false })
  @ApiQuery({ name: 'mealType', required: false })
  @ApiHeader({ name: 'x-user-id', description: '用户ID' })
  findAll(@Query('date') date?: string, @Query('mealType') mealType?: string) {
    return this.sampleService.findAll({ date, mealType });
  }

  @Get(':id')
  @ApiOperation({ summary: '获取留样记录详情' })
  @ApiHeader({ name: 'x-user-id', description: '用户ID' })
  findOne(@Param('id') id: string) {
    return this.sampleService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: '录入留样记录' })
  @ApiHeader({ name: 'x-user-id', description: '用户ID' })
  create(@Body() dto: CreateSampleDto) {
    const operator = { id: 'admin-001', name: '食堂管理员', role: 'canteen_admin', email: 'canteen@school.com' };
    return this.sampleService.create(dto, operator as any);
  }
}
