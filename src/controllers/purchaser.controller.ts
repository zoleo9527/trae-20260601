import {
  Controller,
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
import { ReminderQueryDto } from '../models/reminder.model';

@Controller('purchaser')
@UseGuards(RolesGuard, PermissionGuard)
@Roles(UserRole.PURCHASER)
export class PurchaserController {
  constructor(
    private memberService: MemberService,
    private reminderService: ReminderService,
    private operationLogService: OperationLogService
  ) {}

  @Get('members')
  @Permission('member:read')
  async queryMembers(@Query() query: MemberQueryDto): Promise<ApiResponse> {
    const result = await this.memberService.queryMembers(query);
    return ApiResponse.success(result);
  }

  @Get('members/:id')
  @Permission('member:read')
  async getMember(@Param('id') id: string): Promise<ApiResponse> {
    const detail = await this.memberService.getMemberDetail(id);
    return ApiResponse.success(detail);
  }

  @Get('reminders')
  @Permission('reminder:read')
  async getReminders(@Query() query: ReminderQueryDto): Promise<ApiResponse> {
    const result = await this.reminderService.queryReminders(query);
    return ApiResponse.success(result);
  }

  @Get('reminders/:id')
  @Permission('reminder:read')
  async getReminder(@Param('id') id: string): Promise<ApiResponse> {
    const reminder = await this.reminderService.getReminder(id);
    return ApiResponse.success(reminder);
  }

  @Get('reminders/stats')
  @Permission('reminder:read')
  async getReminderStats(): Promise<ApiResponse> {
    const allReminders = await this.reminderService.queryReminders({});
    const pending = await this.reminderService.queryReminders({
      status: 'pending' as any,
    });
    const triggered = await this.reminderService.queryReminders({
      status: 'triggered' as any,
    });
    const handled = await this.reminderService.queryReminders({
      status: 'handled' as any,
    });
    const anomalies = await this.reminderService.queryReminders({
      isAnomaly: true,
    });
    const formulaBatchIssues = await this.reminderService.queryReminders({
      type: 'formula_batch_issue' as any,
    });
    const promotionIssues = await this.reminderService.queryReminders({
      type: 'promotion_issue' as any,
    });

    return ApiResponse.success({
      total: allReminders.total,
      pending: pending.total,
      triggered: triggered.total,
      handled: handled.total,
      anomalies: anomalies.total,
      formulaBatchIssues: formulaBatchIssues.total,
      promotionIssues: promotionIssues.total,
    });
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
  async getAnomalies(): Promise<ApiResponse> {
    const anomalies = await this.operationLogService.getOpenAnomalies();
    return ApiResponse.success(anomalies);
  }
}