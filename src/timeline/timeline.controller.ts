import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { TimelineBusinessType } from '../common/enums';
import { TimelineService } from './timeline.service';

@ApiTags('timeline')
@Controller('timeline')
export class TimelineController {
  constructor(private readonly timelineService: TimelineService) {}

  @Get('order/:orderId')
  @ApiOperation({ summary: '获取订单处理时间线' })
  getOrderTimeline(@Param('orderId') orderId: string) {
    return this.timelineService.getOrderTimeline(orderId);
  }

  @Get('student/:studentId')
  @ApiOperation({ summary: '获取学生操作时间线' })
  @ApiQuery({ name: 'days', required: false })
  getStudentTimeline(@Param('studentId') studentId: string, @Query('days') days?: number) {
    return this.timelineService.getStudentTimeline(studentId, days);
  }

  @Get('business/:type/:id')
  @ApiOperation({ summary: '按业务类型获取时间线' })
  getTimelineByBusiness(@Param('type') type: TimelineBusinessType, @Param('id') id: string) {
    return this.timelineService.getTimelineByBusiness(type, id);
  }

  @Get('recent')
  @ApiOperation({ summary: '获取最近变更记录' })
  @ApiQuery({ name: 'limit', required: false })
  getRecentChanges(@Query('limit') limit?: number) {
    return this.timelineService.getRecentChanges(limit);
  }
}
