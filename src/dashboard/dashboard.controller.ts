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

@ApiTags('业务工作台')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@UseInterceptors(ResponseTransformInterceptor)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  @ApiOperation({
    summary: '工作台总览',
    description: '一打开系统的总览：进行中订单数、各状态分布、紧急待处理、卡住超过阈值的订单、我的待办数量',
  })
  async overview(@CurrentUser() user: User) {
    return this.dashboardService.getOverview(user);
  }

  @Get('waiting-for-me')
  @ApiOperation({
    summary: '谁在等我处理',
    description: '按角色区分待办：接单员看分配+验收；设计师看待设计+设计中；喷绘员看待喷绘+喷绘中；安装队长看已派工+安装中+被退回',
  })
  async waitingForMe(@CurrentUser() user: User) {
    return this.dashboardService.getWaitingForMe(user);
  }

  @Get('stuck')
  @ApiOperation({
    summary: '哪里卡住了',
    description: '按状态判断卡住时长阈值，展示每个状态下卡住的订单及责任人、判断依据、下一步动作',
  })
  async stuckAnalysis() {
    return this.dashboardService.getStuckAnalysis();
  }

  @Get('recent-changes')
  @ApiQuery({ name: 'limit', required: false, description: '返回条数，默认30' })
  @ApiOperation({
    summary: '最近谁改过',
    description: '操作日志聚合，一眼看出最近的动作：谁、在哪个订单、做了什么',
  })
  async recentChanges(@Query('limit') limit = 30) {
    return this.dashboardService.getRecentChanges(+limit);
  }

  @Get('workload')
  @ApiOperation({
    summary: '各角色工作量',
    description: '设计师、喷绘员、安装队长的当前进行中订单数及今日完成数，便于分配任务',
  })
  async workload() {
    return this.dashboardService.getWorkloadByRole();
  }
}
