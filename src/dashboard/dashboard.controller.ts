import {
  Controller,
  Get,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { DashboardService } from './dashboard.service';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../auth/entities/user.entity';
import { ResponseTransformInterceptor } from '../common/interceptors/response.interceptor';

@ApiTags('仪表盘')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@UseInterceptors(ResponseTransformInterceptor)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  @ApiOperation({
    summary: '全局概览',
    description: '一打开系统的总览：进行中工单数量、各状态分布、紧急待处理、卡住超过1小时的工单',
  })
  async overview(@CurrentUser() user: User) {
    return this.dashboardService.getOverview(user);
  }

  @Get('waiting-for-me')
  @ApiOperation({
    summary: '谁在等我处理',
    description: '按角色区分：前台看未签授权+待取机；维修师看分配给自己的工单+待领取工单池',
  })
  async waitingForMe(@CurrentUser() user: User) {
    return this.dashboardService.getWaitingForMe(user);
  }

  @Get('stuck')
  @ApiOperation({
    summary: '哪里卡住了',
    description: '按状态判断卡住时长阈值，展示每个状态下卡住的工单及责任人，作为现场判断依据',
  })
  async stuckAnalysis() {
    return this.dashboardService.getStuckAnalysis();
  }

  @Get('recent-changes')
  @ApiQuery({ name: 'limit', required: false, description: '返回条数，默认30' })
  @ApiOperation({
    summary: '最近谁改过',
    description: '操作日志聚合，一眼看出最近的动作：谁、在哪个工单、做了什么',
  })
  async recentChanges(@Query('limit') limit = 30) {
    return this.dashboardService.getRecentChanges(+limit);
  }

  @Get('technician-workload')
  @ApiOperation({
    summary: '维修师工作量',
    description: '各维修师当前进行中工单数及今日完成数，便于分配工单',
  })
  async technicianWorkload() {
    return this.dashboardService.getTechnicianWorkload();
  }
}
