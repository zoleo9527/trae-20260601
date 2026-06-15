import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { MemberService } from '../services/member.service';
import { ReminderService } from '../services/reminder.service';
import { OperationLogService } from '../services/operation-log.service';
import { RolesGuard, PermissionGuard } from '../guards/auth.guard';
import { Roles, Permission } from '../decorators/auth.decorator';
import { CurrentUser } from '../decorators/user.decorator';
import { UserRole, UserContext } from '../common/role';
import { ApiResponse } from '../common/error-code';
import { MemberQueryDto } from '../models/member.model';
import { HandleReminderDto, ReminderQueryDto } from '../models/reminder.model';

@Controller('manager')
@UseGuards(RolesGuard, PermissionGuard)
@Roles(UserRole.STORE_MANAGER)
export class ManagerController {
  constructor(
    private memberService: MemberService,
    private reminderService: ReminderService,
    private operationLogService: OperationLogService
  ) {}

  @Get('members/pending')
  @Permission('member:read')
  async getPendingMembers(
    @Query() query: MemberQueryDto,
    @CurrentUser() user: UserContext
  ): Promise<ApiResponse> {
    query.status = 'pending_approval' as any;
    if (user.storeId) {
      query.storeId = user.storeId;
    }
    const result = await this.memberService.queryMembers(query);
    return ApiResponse.success(result);
  }

  @Put('members/:id/approve')
  @Permission('member:approve')
  async approveMember(
    @Param('id') id: string,
    @CurrentUser() user: UserContext
  ): Promise<ApiResponse> {
    const member = await this.memberService.approveMember(
      id,
      user.id,
      user.name,
      user.role
    );

    const reminders = await this.reminderService.getReminderHistoryWithAnomalies(
      id,
      this.memberService
    );

    return ApiResponse.success(
      {
        member,
        triggeredReminders: reminders.length,
      },
      '会员审核通过，已自动触发月龄提醒'
    );
  }

  @Put('members/:id/reapprove')
  @Permission('member:approve')
  async reapproveMember(
    @Param('id') id: string,
    @CurrentUser() user: UserContext
  ): Promise<ApiResponse> {
    const member = await this.memberService.reapproveMember(
      id,
      user.id,
      user.name,
      user.role
    );

    const reminders = await this.reminderService.getReminderHistoryWithAnomalies(
      id,
      this.memberService
    );

    return ApiResponse.success(
      {
        member,
        triggeredReminders: reminders.length,
        wasResubmitted: true,
      },
      '重新审核通过，已自动触发月龄提醒'
    );
  }

  @Put('members/:id/reject')
  @Permission('member:reject')
  async rejectMember(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser() user: UserContext
  ): Promise<ApiResponse> {
    const member = await this.memberService.rejectMember(
      id,
      reason,
      user.id,
      user.name,
      user.role
    );
    return ApiResponse.success(member, '会员已退回，需修改后重新提交');
  }

  @Get('members')
  @Permission('member:read')
  async queryMembers(
    @Query() query: MemberQueryDto,
    @CurrentUser() user: UserContext
  ): Promise<ApiResponse> {
    if (user.storeId) {
      query.storeId = user.storeId;
    }
    const result = await this.memberService.queryMembers(query);
    return ApiResponse.success(result);
  }

  @Get('members/:id')
  @Permission('member:read')
  async getMember(@Param('id') id: string): Promise<ApiResponse> {
    const member = await this.memberService.getMember(id);
    return ApiResponse.success(member);
  }

  @Get('reminders')
  @Permission('reminder:read')
  async getReminders(
    @Query() query: ReminderQueryDto
  ): Promise<ApiResponse> {
    const result = await this.reminderService.queryReminders(query);
    return ApiResponse.success(result);
  }

  @Get('reminders/anomalies')
  @Permission('reminder:read')
  async getAnomalyReminders(): Promise<ApiResponse> {
    const result = await this.reminderService.queryReminders({
      isAnomaly: true,
      status: 'pending' as any,
    });
    return ApiResponse.success(result);
  }

  @Put('reminders/:id/handle')
  @Permission('reminder:handle')
  async handleReminder(
    @Param('id') id: string,
    @Body() dto: HandleReminderDto,
    @CurrentUser() user: UserContext
  ): Promise<ApiResponse> {
    const reminder = await this.reminderService.handleReminder(
      id,
      dto,
      user.id,
      user.name,
      user.role
    );
    return ApiResponse.success(reminder, '提醒已处理');
  }

  @Put('reminders/:id/trigger')
  @Permission('reminder:handle')
  async triggerReminder(
    @Param('id') id: string,
    @CurrentUser() user: UserContext
  ): Promise<ApiResponse> {
    const reminder = await this.reminderService.triggerReminder(
      id,
      user.id,
      user.name,
      user.role
    );
    return ApiResponse.success(reminder, '提醒已触发');
  }

  @Get('members/:id/reminders/history')
  @Permission('reminder:read')
  async getReminderHistory(@Param('id') memberId: string): Promise<ApiResponse> {
    const history = await this.reminderService.getReminderHistoryWithAnomalies(
      memberId,
      this.memberService
    );
    return ApiResponse.success(history);
  }

  @Get('members/:id/anomalies')
  @Permission('member:read')
  async getMemberAnomalies(@Param('id') memberId: string): Promise<ApiResponse> {
    const anomalies = await this.operationLogService.getAnomaliesByMember(memberId);
    return ApiResponse.success(anomalies);
  }

  @Get('members/:id/logs')
  @Permission('member:read')
  async getMemberLogs(@Param('id') id: string): Promise<ApiResponse> {
    const logs = await this.operationLogService.getLogsByTarget(id);
    return ApiResponse.success(logs);
  }

  @Get('anomalies')
  @Permission('reminder:read')
  async getOpenAnomalies(): Promise<ApiResponse> {
    const anomalies = await this.operationLogService.getOpenAnomalies();
    return ApiResponse.success(anomalies);
  }

  @Put('anomalies/:id/resolve')
  @Permission('member:approve')
  async resolveAnomaly(
    @Param('id') id: string,
    @Body('resolution') resolution: string,
    @CurrentUser() user: UserContext
  ): Promise<ApiResponse> {
    const anomaly = await this.operationLogService.resolveAnomaly(
      id,
      resolution,
      user.id
    );
    return ApiResponse.success(anomaly, '异常已解决');
  }
}