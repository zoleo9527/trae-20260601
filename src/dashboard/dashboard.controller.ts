import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';

@ApiTags('仪表盘 Dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  @ApiOperation({ summary: '综合统计总览', description: '获取Intake、Order、Review、匹配等全局统计数据' })
  async getOverview() {
    return this.dashboardService.getOverview();
  }

  @Get('owner-summary')
  @ApiOperation({
    summary: '责任人工作汇总',
    description: '按角色分组（客服/家政员/质检主管），展示各自在处理的Intake+Review+Order数量和明细',
  })
  async getOwnerSummary() {
    return this.dashboardService.getOwnerSummary();
  }

  @Get('blocked-intakes')
  @ApiOperation({
    summary: '卡住的Intake列表',
    description: '所有卡住的Intake，含卡住时长stuckHours、阻塞原因blockReason、责任人信息',
  })
  async getBlockedIntakes() {
    return this.dashboardService.getBlockedIntakes();
  }

  @Get('matching-block-reasons')
  @ApiOperation({
    summary: '匹配失败原因分析',
    description: '全局匹配失败原因分析：按Intake聚合，输出top reasons、各round分析、总尝试数、成功率',
  })
  @ApiQuery({ name: 'intakeId', required: false, description: '指定单个Intake ID进行分析，不传则为全局分析' })
  async getMatchingBlockReasons(@Query('intakeId') intakeId?: string) {
    return this.dashboardService.getMatchingBlockReasons(intakeId);
  }

  @Get('matching-block-reasons/:intakeId')
  @ApiOperation({
    summary: '单个Intake匹配失败分析',
    description: '分析指定Intake的匹配失败原因、各轮次情况',
  })
  @ApiParam({ name: 'intakeId', description: 'Intake ID' })
  async getMatchingBlockReasonsByIntake(@Param('intakeId') intakeId: string) {
    return this.dashboardService.getMatchingBlockReasons(intakeId);
  }
}
