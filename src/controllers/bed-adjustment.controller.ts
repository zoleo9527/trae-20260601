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
    };
  }

  private formatListItem(item: any) {
    return this.formatDetail(item);
  }
}
