import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { MemberService } from '../services/member.service';
import { ReminderService } from '../services/reminder.service';
import { OperationLogService } from '../services/operation-log.service';
import { RolesGuard, PermissionGuard } from '../guards/auth.guard';
import { Roles, Permission } from '../decorators/auth.decorator';
import { CurrentUser } from '../decorators/user.decorator';
import { UserRole, UserContext } from '../common/role';
import { ApiResponse, ErrorCode } from '../common/error-code';
import {
  CreateMemberDto,
  UpdateMemberDto,
  MemberQueryDto,
} from '../models/member.model';
import { CreateBabyDto } from '../models/baby.model';
import { HandleReminderDto, ReminderQueryDto, AnomalyReportDto } from '../models/reminder.model';

@Controller('clerk')
@UseGuards(RolesGuard, PermissionGuard)
@Roles(UserRole.CLERK)
export class ClerkController {
  constructor(
    private memberService: MemberService,
    private reminderService: ReminderService,
    private operationLogService: OperationLogService
  ) {}

  @Post('members')
  @Permission('member:create')
  async createMember(
    @Body() dto: CreateMemberDto,
    @CurrentUser() user: UserContext
  ): Promise<ApiResponse> {
    const member = await this.memberService.createMember(
      dto,
      user.id,
      user.name,
      user.role,
      user.storeId || 'default-store'
    );

    return ApiResponse.success(member, '会员建档成功，等待审核');
  }

  @Get('members')
  @Permission('member:read')
  async queryMembers(
    @Query() query: MemberQueryDto,
    @CurrentUser() user: UserContext
  ): Promise<ApiResponse> {
    if (!query.storeId && user.storeId) {
      query.storeId = user.storeId;
    }
    if (!query.registeredBy) {
      query.registeredBy = user.id;
    }

    const result = await this.memberService.queryMembers(query);
    return ApiResponse.success(result);
  }

  @Get('members/:id')
  @Permission('member:read')
  async getMember(@Param('id') id: string): Promise<ApiResponse> {
    const detail = await this.memberService.getMemberDetail(id);
    return ApiResponse.success(detail);
  }

  @Put('members/:id')
  @Permission('member:update')
  async updateMember(
    @Param('id') id: string,
    @Body() dto: UpdateMemberDto,
    @CurrentUser() user: UserContext
  ): Promise<ApiResponse> {
    const member = await this.memberService.updateMember(
      id,
      dto,
      user.id,
      user.name,
      user.role
    );
    return ApiResponse.success(member, '会员信息更新成功');
  }

  @Put('members/:id/resubmit')
  @Permission('member:update')
  async resubmitMember(
    @Param('id') id: string,
    @Body() dto: UpdateMemberDto,
    @CurrentUser() user: UserContext
  ): Promise<ApiResponse> {
    const member = await this.memberService.resubmitMember(
      id,
      dto,
      user.id,
      user.name,
      user.role
    );
    return ApiResponse.success(member, '档案已重新提交，等待店长审核');
  }

  @Post('members/:id/babies')
  @Permission('baby:create')
  async addBaby(
    @Param('id') memberId: string,
    @Body() dto: CreateBabyDto,
    @CurrentUser() user: UserContext
  ): Promise<ApiResponse> {
    const baby = await this.memberService.addBabyToMember(
      memberId,
      dto,
      user.id,
      user.name,
      user.role
    );
    return ApiResponse.success(baby, '宝宝信息添加成功，已自动生成月龄提醒');
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

  @Get('members/:id/reminders/history')
  @Permission('reminder:read')
  async getReminderHistory(@Param('id') memberId: string): Promise<ApiResponse> {
    const history = await this.reminderService.getReminderHistoryWithAnomalies(
      memberId,
      this.memberService
    );
    return ApiResponse.success(history);
  }

  @Post('anomalies/report')
  @Permission('member:create')
  async reportAnomaly(
    @Body() dto: AnomalyReportDto,
    @CurrentUser() user: UserContext
  ): Promise<ApiResponse> {
    const result = await this.reminderService.reportAnomaly(
      dto,
      user.id,
      user.name,
      user.role
    );
    return ApiResponse.success(result, '异常已上报，已生成提醒和异常记录');
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
}