import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiHeader, ApiOperation } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { AuthGuard, RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../common/types/user.type';

@ApiTags('角色工作台/Dashboard')
@Controller('')
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get('roles-catalog')
  @ApiOperation({ summary: '[公开] 角色入口清单：三角色+示例用户ID+可访问接口' })
  rolesCatalog() {
    return this.service.getRolesCatalog();
  }

  @Get('dashboard')
  @ApiHeader({ name: 'x-user-id', description: '当前操作用户ID', required: true })
  @ApiOperation({ summary: '[登录后] 三角色工作台聚合入口：待办、统计、责任追踪' })
  @UseGuards(AuthGuard, RolesGuard)
  dashboard(@CurrentUser() user: User) {
    return this.service.getWorkbench(user);
  }
}
