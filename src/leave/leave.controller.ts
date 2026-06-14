import { Controller, Post, Get, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiHeader, ApiOperation } from '@nestjs/swagger';
import { LeaveService } from './leave.service';
import { AuthGuard, RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User, UserRole } from '../common/types/user.type';
import {
  CreateLeaveRequestDto,
  UpdateLeaveMaterialDto,
  ReviewLeaveDto,
  UrgeLeaveDto,
  QueryLeaveListDto,
} from './dto/leave.dto';

@ApiTags('老师请假处理')
@ApiHeader({ name: 'x-user-id', description: '当前操作用户ID', required: true })
@Controller('leaves')
@UseGuards(AuthGuard, RolesGuard)
export class LeaveController {
  constructor(private readonly service: LeaveService) {}

  @Post()
  @Roles(UserRole.TEACHER)
  @ApiOperation({ summary: '[任课老师] 提交请假申请（幂等）', description: '需要携带 x-user-id=T001/T002/T003' })
  create(@Body() dto: CreateLeaveRequestDto, @CurrentUser() user: User) {
    return this.service.create(dto, user);
  }

  @Get()
  @ApiOperation({ summary: '[所有角色] 查询请假列表', description: '任课老师只看自己的，教务/顾问可看全部' })
  list(@Query() query: QueryLeaveListDto, @CurrentUser() user: User) {
    return this.service.list(query, user);
  }

  @Get(':id')
  @ApiOperation({ summary: '[所有角色] 查看请假详情' })
  detail(@Param('id') id: string) {
    return this.service.detail(id);
  }

  @Get(':id/blocking')
  @ApiOperation({ summary: '[核心] 回答：请假卡在哪里？谁在处理？', description: '系统三件事之1+2：当前处理人 + 阻塞点' })
  blocking(@Param('id') id: string) {
    return this.service.getBlockingInfo(id);
  }

  @Get(':id/logs')
  @ApiOperation({ summary: '[所有角色] 请假操作日志（回看）' })
  logs(@Param('id') id: string) {
    return this.service.getOperationLogs(id);
  }

  @Patch(':id/review')
  @Roles(UserRole.AFFAIRS)
  @ApiOperation({ summary: '[教务] 审批请假：通过/拒绝/退回/要求补材料（幂等）' })
  review(@Param('id') id: string, @Body() dto: ReviewLeaveDto, @CurrentUser() user: User) {
    return this.service.review(id, dto, user);
  }

  @Patch(':id/material')
  @Roles(UserRole.TEACHER)
  @ApiOperation({ summary: '[任课老师] 补材料/重新提交（幂等），用于RETURNED和PENDING_MATERIAL状态' })
  updateMaterial(@Param('id') id: string, @Body() dto: UpdateLeaveMaterialDto, @CurrentUser() user: User) {
    return this.service.updateMaterial(id, dto, user);
  }

  @Patch(':id/urge')
  @Roles(UserRole.ADVISOR, UserRole.AFFAIRS)
  @ApiOperation({ summary: '[家长顾问/教务] 催促处理：进入URGENCY状态（幂等）' })
  urge(@Param('id') id: string, @Body() dto: UrgeLeaveDto, @CurrentUser() user: User) {
    return this.service.urge(id, dto, user);
  }
}
