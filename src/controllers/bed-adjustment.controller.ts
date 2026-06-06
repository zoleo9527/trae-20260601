import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { BedAdjustmentService } from '../services/bed-adjustment.service';
import { ApiResponse } from '../common/response';
import { CreateAdjustmentDto, ProcessAdjustmentDto } from '../dto/bed-adjustment.dto';
import { AdjustmentStatus, AdjustmentStatusLabel, StaffRoleLabel } from '../common/enums';

@Controller('api/bed-adjustment')
export class BedAdjustmentController {
  constructor(private readonly adjustmentService: BedAdjustmentService) {}

  @Post()
  async create(@Body() dto: CreateAdjustmentDto) {
    try {
      const data = await this.adjustmentService.create(dto);
      return ApiResponse.success(this.formatDetail(data));
    } catch (e) {
      return ApiResponse.error(e.getStatus ? e.getStatus() : 50000, e.message);
    }
  }

  @Get(':id')
  async getDetail(@Param('id') id: string) {
    try {
      const data = await this.adjustmentService.getDetail(id);
      return ApiResponse.success(this.formatDetail(data));
    } catch (e) {
      return ApiResponse.error(e.getStatus ? e.getStatus() : 50000, e.message);
    }
  }

  @Get()
  async list(@Query('status') status?: AdjustmentStatus, @Query('studentId') studentId?: string) {
    try {
      const data = await this.adjustmentService.list({ status, studentId });
      return ApiResponse.success(data.map(item => this.formatListItem(item)));
    } catch (e) {
      return ApiResponse.error(e.getStatus ? e.getStatus() : 50000, e.message);
    }
  }

  @Post(':id/process')
  async process(@Param('id') id: string, @Body() dto: ProcessAdjustmentDto) {
    try {
      const data = await this.adjustmentService.process(id, dto);
      return ApiResponse.success(this.formatDetail(data));
    } catch (e) {
      return ApiResponse.error(e.getStatus ? e.getStatus() : 50000, e.message);
    }
  }

  @Get(':id/logs')
  async getLogs(@Param('id') id: string) {
    try {
      const logs = await this.adjustmentService.getOperationLogs(id);
      return ApiResponse.success(logs.map(log => ({
        ...log,
        operator: log.operator ? {
          ...log.operator,
          roleLabel: StaffRoleLabel[log.operator.role] || log.operator.role,
        } : null,
        fromStatusLabel: log.fromStatus ? AdjustmentStatusLabel[log.fromStatus] || log.fromStatus : null,
        toStatusLabel: log.toStatus ? AdjustmentStatusLabel[log.toStatus] || log.toStatus : null,
      })));
    } catch (e) {
      return ApiResponse.error(e.getStatus ? e.getStatus() : 50000, e.message);
    }
  }

  @Get(':id/review')
  async getReview(@Param('id') id: string) {
    try {
      const detail = await this.adjustmentService.getDetail(id);
      const logs = await this.adjustmentService.getOperationLogs(id);
      return ApiResponse.success({
        detail: this.formatDetail(detail),
        logs: logs.map(log => ({
          ...log,
          operator: log.operator ? {
            ...log.operator,
            roleLabel: StaffRoleLabel[log.operator.role] || log.operator.role,
          } : null,
          fromStatusLabel: log.fromStatus ? AdjustmentStatusLabel[log.fromStatus] || log.fromStatus : null,
          toStatusLabel: log.toStatus ? AdjustmentStatusLabel[log.toStatus] || log.toStatus : null,
        })),
      });
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
      sourceBed: item.sourceBed ? {
        id: item.sourceBed.id,
        buildingNo: item.sourceBed.buildingNo,
        roomNo: item.sourceBed.roomNo,
        bedNo: item.sourceBed.bedNo,
        floor: item.sourceBed.floor,
      } : null,
      targetBed: item.targetBed ? {
        id: item.targetBed.id,
        buildingNo: item.targetBed.buildingNo,
        roomNo: item.targetBed.roomNo,
        bedNo: item.targetBed.bedNo,
        floor: item.targetBed.floor,
      } : null,
      reason: item.reason,
      reasonDetail: item.reasonDetail,
      status: item.status,
      statusLabel: AdjustmentStatusLabel[item.status] || item.status,
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
    if (status === AdjustmentStatus.COMPLETED || status === AdjustmentStatus.REJECTED) {
      return false;
    }
    if (status === AdjustmentStatus.OVERDUE) {
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
    if (item.status === AdjustmentStatus.MAINTENANCE_REQUIRED) {
      return '维修人员';
    }
    if (item.status === AdjustmentStatus.PENDING) {
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
      case AdjustmentStatus.PENDING:
        return '待宿管员初查申请';
      case AdjustmentStatus.IN_PROGRESS:
        if (role === 'maintenance') {
          return '维修人员处理设施问题中';
        }
        if (role === 'dorm_manager') {
          return '宿管员核实情况中';
        }
        return '辅导员审核中';
      case AdjustmentStatus.RETURNED:
        return '退回学生补充材料';
      case AdjustmentStatus.REJECTED:
        return '已拒绝，流程终止';
      case AdjustmentStatus.DISPUTED:
        return '责任争议，三方协商中';
      case AdjustmentStatus.OVERDUE:
        if (role === 'maintenance') {
          return '维修处理逾期，待跟进';
        }
        return '处理逾期，待跟进';
      case AdjustmentStatus.APPROVED:
        return '已通过，待宿管员执行调换';
      case AdjustmentStatus.COMPLETED:
        return '已完成床位调换';
      case AdjustmentStatus.MAINTENANCE_REQUIRED:
        return '维修人员处理中，待修复完成';
      default:
        return '处理中';
    }
  }

  private getUnfinishedReason(item: any): string | null {
    if (item.status === AdjustmentStatus.COMPLETED) {
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
    if (item.status === AdjustmentStatus.OVERDUE) {
      return '超过预期处理时间未完成';
    }
    if (item.status === AdjustmentStatus.DISPUTED) {
      return '存在责任争议，待协商解决';
    }
    if (item.status === AdjustmentStatus.MAINTENANCE_REQUIRED) {
      return '需维修人员配合处理设施问题';
    }
    if (item.status === AdjustmentStatus.IN_PROGRESS) {
      const role = this.getHandlerRole(item);
      if (role === 'maintenance') {
        return item.reasonDetail ? `维修处理中：${item.reasonDetail}` : '维修人员正在处理设施问题';
      }
      if (role === 'dorm_manager') {
        return '宿管员正在核实情况';
      }
    }
    if (item.reasonDetail) {
      return `调整原因：${item.reasonDetail}`;
    }
    return '正在按流程推进';
  }

  private formatListItem(item: any) {
    return this.formatDetail(item);
  }
}
