import { Controller, Post, Get, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiHeader, ApiOperation } from '@nestjs/swagger';
import { MakeupService } from './makeup.service';
import { AuthGuard, RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User, UserRole } from '../common/types/user.type';
import {
  CreateMakeupDto,
  ProposeMakeupDto,
  ConfirmMakeupDto,
  ScheduleMakeupDto,
  MarkCompleteDto,
  QueryMakeupListDto,
} from './dto/makeup.dto';

@ApiTags('补课协调')
@ApiHeader({ name: 'x-user-id', description: '当前操作用户ID', required: true })
@Controller('makeups')
@UseGuards(AuthGuard, RolesGuard)
export class MakeupController {
  constructor(private readonly service: MakeupService) {}

  @Post()
  @Roles(UserRole.AFFAIRS)
  @ApiOperation({ summary: '[教务] 创建补课协调（幂等），关联请假ID' })
  create(@Body() dto: CreateMakeupDto, @CurrentUser() user: User) {
    return this.service.create(dto, user);
  }

  @Get()
  @ApiOperation({ summary: '[所有角色] 补课协调列表' })
  list(@Query() query: QueryMakeupListDto, @CurrentUser() user: User) {
    return this.service.list(query, user);
  }

  @Get(':id')
  @ApiOperation({ summary: '[所有角色] 补课协调详情' })
  detail(@Param('id') id: string) {
    return this.service.detail(id);
  }

  @Get(':id/review')
  @ApiOperation({
    summary: '[核心] 补课协调回看 + 为什么还没完成？谁在处理？',
    description: '系统三件事之3：完整时间线 + 当前责任人 + 未完成原因说明',
  })
  review(@Param('id') id: string) {
    return this.service.review(id);
  }

  @Patch(':id/propose')
  @Roles(UserRole.TEACHER)
  @ApiOperation({ summary: '[任课老师] 提议补课时间与代课老师（幂等）' })
  propose(@Param('id') id: string, @Body() dto: ProposeMakeupDto, @CurrentUser() user: User) {
    return this.service.proposeMakeup(id, dto, user);
  }

  @Patch(':id/confirm-parent')
  @Roles(UserRole.ADVISOR)
  @ApiOperation({ summary: '[家长顾问] 转达家长确认结果：全部/部分/拒绝（幂等）' })
  confirm(@Param('id') id: string, @Body() dto: ConfirmMakeupDto, @CurrentUser() user: User) {
    return this.service.confirmParent(id, dto, user);
  }

  @Patch(':id/schedule')
  @Roles(UserRole.AFFAIRS)
  @ApiOperation({ summary: '[教务] 正式排课进入待执行（幂等）' })
  schedule(@Param('id') id: string, @Body() dto: ScheduleMakeupDto, @CurrentUser() user: User) {
    return this.service.schedule(id, dto, user);
  }

  @Patch(':id/complete')
  @Roles(UserRole.AFFAIRS)
  @ApiOperation({ summary: '[教务] 标记补课执行完成（幂等）' })
  complete(@Param('id') id: string, @Body() dto: MarkCompleteDto, @CurrentUser() user: User) {
    return this.service.markComplete(id, dto, user);
  }
}
