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
    };
  }

  private formatListItem(item: any) {
    return this.formatDetail(item);
  }
}
