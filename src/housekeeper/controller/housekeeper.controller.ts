import { Body, Controller, Get, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { HousekeeperService } from '../service/housekeeper.service';
import { CreateHousekeeperDto } from '../dto/create-housekeeper.dto';
import { UpdateHousekeeperDto } from '../dto/update-housekeeper.dto';
import { QueryHousekeeperDto } from '../dto/query-housekeeper.dto';
import { HousekeeperStatus, Role } from '../../common/enums';

@ApiTags('阿姨档案 Housekeeper')
@Controller('housekeepers')
export class HousekeeperController {
  constructor(private readonly service: HousekeeperService) {}

  @Post()
  @ApiOperation({ summary: '创建阿姨档案' })
  create(@Body() dto: CreateHousekeeperDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新阿姨档案' })
  update(@Param('id') id: string, @Body() dto: UpdateHousekeeperDto) {
    return this.service.update(id, dto);
  }

  @Get()
  @ApiOperation({ summary: '分页查询阿姨列表' })
  findAll(@Query() query: QueryHousekeeperDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '查询阿姨详情' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id/no-show')
  @ApiOperation({ summary: '标记爽约一次' })
  markNoShow(@Param('id') id: string, @Body('actor') actor) {
    return this.service.markNoShow(id, actor);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: '修改阿姨状态' })
  changeStatus(@Param('id') id: string, @Body('status') status: HousekeeperStatus, @Body('actor') actor) {
    return this.service.changeStatus(id, status, actor);
  }

  @Patch(':id/review')
  @ApiOperation({ summary: '增加评价并更新平均评分' })
  incrementReview(@Param('id') id: string, @Body('isPositive') isPositive: boolean, @Body('rating') rating: number) {
    return this.service.incrementReview(id, isPositive, rating);
  }
}
