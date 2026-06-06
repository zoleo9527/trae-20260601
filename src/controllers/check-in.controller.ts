import { Controller, Get, Post, Body, Param, Query, HttpException } from '@nestjs/common';
import { CheckInService } from '../services/check-in.service';
import { ApiResponse } from '../common/response';
import { CreateCheckInDto, ProcessCheckInDto } from '../dto/check-in.dto';
import { CheckInStatus, CheckInStatusLabel, StaffRoleLabel } from '../common/enums';

@Controller('api/check-in')
export class CheckInController {
  constructor(private readonly checkInService: CheckInService) {}

  @Post()
  async create(@Body() dto: CreateCheckInDto) {
    try {
      const data = await this.checkInService.create(dto);
      return ApiResponse.success(this.formatDetail(data));
    } catch (e) {
      return ApiResponse.error(e.getStatus ? e.getStatus() : 50000, e.message);
    }
  }

  @Get(':id')
  async getDetail(@Param('id') id: string) {
    try {
      const data = await this.checkInService.getDetail(id);
      return ApiResponse.success(this.formatDetail(data));
    } catch (e) {
      return ApiResponse.error(e.getStatus ? e.getStatus() : 50000, e.message);
    }
  }

  @Get()
  async list(@Query('status') status?: CheckInStatus, @Query('studentId') studentId?: string) {
    try {
      const data = await this.checkInService.list({ status, studentId });
      return ApiResponse.success(data.map(item => this.formatListItem(item)));
    } catch (e) {
      return ApiResponse.error(e.getStatus ? e.getStatus() : 50000, e.message);
    }
  }

  @Post(':id/process')
  async process(@Param('id') id: string, @Body() dto: ProcessCheckInDto) {
    try {
      const data = await this.checkInService.process(id, dto);
      return ApiResponse.success(this.formatDetail(data));
    } catch (e) {
      return ApiResponse.error(e.getStatus ? e.getStatus() : 50000, e.message);
    }
  }

  @Get(':id/logs')
  async getLogs(@Param('id') id: string) {
    try {
      const logs = await this.checkInService.getOperationLogs(id);
      return ApiResponse.success(logs.map(log => ({
        ...log,
        operator: log.operator ? {
          ...log.operator,
          roleLabel: StaffRoleLabel[log.operator.role] || log.operator.role,
        } : null,
        fromStatusLabel: log.fromStatus ? CheckInStatusLabel[log.fromStatus] || log.fromStatus : null,
        toStatusLabel: log.toStatus ? CheckInStatusLabel[log.toStatus] || log.toStatus : null,
      })));
    } catch (e) {
      return ApiResponse.error(e.getStatus ? e.getStatus() : 50000, e.message);
    }
  }

  private formatDetail(item: any) {
    const isOverdue = this.calculateOverdue(item.status, item.expectedCompleteAt, item.completedAt);
    const responsibleRole = this.getResponsibleRole(item);
    const blockedAt = this.getBlockedAt(item);
    const unfinishedReason = this.getUnfinishedReason(item);

    return {
      id: item.id,
      student: item.student ? {
        id: item.student.id,
        name: item.student.name,
        studentNo: item.student.studentNo,
        department: item.student.department,
        major: item.student.major,
        grade: item.student.grade,
      } : null,
      bed: item.bed ? {
        id: item.bed.id,
        buildingNo: item.bed.buildingNo,
        roomNo: item.bed.roomNo,
        bedNo: item.bed.bedNo,
        floor: item.bed.floor,
      } : null,
      status: item.status,
      statusLabel: CheckInStatusLabel[item.status] || item.status,
      currentHandler: item.currentHandler ? {
        id: item.currentHandler.id,
        name: item.currentHandler.name,
        role: item.currentHandler.role,
        roleLabel: StaffRoleLabel[item.currentHandler.role] || item.currentHandler.role,
      } : null,
      assignedTo: item.assignedTo ? {
        id: item.assignedTo.id,
        name: item.assignedTo.name,
        role: item.assignedTo.role,
        roleLabel: StaffRoleLabel[item.assignedTo.role] || item.assignedTo.role,
      } : null,
      remark: item.remark,
      rejectionReason: item.rejectionReason,
      returnReason: item.returnReason,
      expectedCompleteAt: item.expectedCompleteAt,
      completedAt: item.completedAt,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      isOverdue,
      responsibleRole,
      blockedAt,
      unfinishedReason,
    };
  }

  private calculateOverdue(status: string, expectedCompleteAt: Date, completedAt: Date): boolean {
    if (status === CheckInStatus.COMPLETED || status === CheckInStatus.REJECTED) {
      return false;
    }
    if (status === CheckInStatus.OVERDUE) {
      return true;
    }
    if (!expectedCompleteAt) {
      return false;
    }
    return new Date() > new Date(expectedCompleteAt);
  }

  private getResponsibleRole(item: any): string {
    const handler = item.currentHandler || item.assignedTo;
    if (handler) {
      return StaffRoleLabel[handler.role] || handler.role;
    }
    if (item.status === CheckInStatus.PENDING) {
      return '待分配处理人';
    }
    return '待确认';
  }

  private getHandlerRole(item: any): string | null {
    const handler = item.currentHandler || item.assignedTo;
    return handler ? handler.role : null;
  }

  private getBlockedAt(item: any): string {
    const role = this.getHandlerRole(item);

    switch (item.status) {
      case CheckInStatus.PENDING:
        return '待宿管员初查分配';
      case CheckInStatus.IN_PROGRESS:
        if (role === 'dorm_manager') {
          return '宿管员核实分配信息中';
        }
        return '辅导员审核中';
      case CheckInStatus.RETURNED:
        return '退回学生补充材料';
      case CheckInStatus.REJECTED:
        return '已拒绝，流程终止';
      case CheckInStatus.DISPUTED:
        return '责任争议，三方协商中';
      case CheckInStatus.OVERDUE:
        if (role === 'dorm_manager') {
          return '宿管分配逾期，待跟进';
        }
        return '处理逾期，待跟进';
      case CheckInStatus.APPROVED:
        return '已通过，待宿管员确认入住';
      case CheckInStatus.COMPLETED:
        return '已完成入住';
      default:
        return '处理中';
    }
  }

  private getUnfinishedReason(item: any): string | null {
    if (item.status === CheckInStatus.COMPLETED) {
      return null;
    }
    if (item.returnReason) {
      return `退回补充：${item.returnReason}`;
    }
    if (item.rejectionReason) {
      return `已拒绝：${item.rejectionReason}`;
    }
    if (item.remark) {
      return item.remark;
    }
    if (item.status === CheckInStatus.OVERDUE) {
      return '超过预期处理时间未完成';
    }
    if (item.status === CheckInStatus.DISPUTED) {
      return '存在责任争议，待协商解决';
    }
    return '正在按流程推进';
  }

  private formatListItem(item: any) {
    return this.formatDetail(item);
  }
}
