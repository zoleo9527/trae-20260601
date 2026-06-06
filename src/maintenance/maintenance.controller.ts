import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { MaintenanceService } from './maintenance.service';

@ApiTags('maintenance')
@Controller('api/maintenance')
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  @Get('my-orders')
  @ApiOperation({ summary: '获取我的工单（维修师傅）' })
  @ApiQuery({ name: 'workerId', required: true })
  async getMyOrders(@Query('workerId') workerId: string): Promise<any[]> {
    return this.maintenanceService.getMyOrders(workerId);
  }

  @Post(':repairOrderId/accept')
  @ApiOperation({ summary: '接单（维修师傅）' })
  async acceptOrder(
    @Param('repairOrderId') repairOrderId: string,
    @Body() body: { workerId: string; workerName: string; note?: string },
  ): Promise<void> {
    const operator = {
      id: body.workerId,
      name: body.workerName,
      role: 'maintenance_worker' as const,
    };
    return this.maintenanceService.acceptOrder(repairOrderId, operator, body.note);
  }

  @Post(':repairOrderId/start')
  @ApiOperation({ summary: '开始处理（维修师傅）' })
  async startProcessing(
    @Param('repairOrderId') repairOrderId: string,
    @Body() body: { workerId: string; workerName: string; note?: string },
  ): Promise<void> {
    const operator = {
      id: body.workerId,
      name: body.workerName,
      role: 'maintenance_worker' as const,
    };
    return this.maintenanceService.startProcessing(repairOrderId, operator, body.note);
  }

  @Post(':repairOrderId/complete')
  @ApiOperation({ summary: '完成维修（维修师傅）' })
  async completeOrder(
    @Param('repairOrderId') repairOrderId: string,
    @Body() body: { workerId: string; workerName: string; note?: string },
  ): Promise<void> {
    const operator = {
      id: body.workerId,
      name: body.workerName,
      role: 'maintenance_worker' as const,
    };
    return this.maintenanceService.completeOrder(repairOrderId, operator, body.note);
  }

  @Post(':repairOrderId/progress-note')
  @ApiOperation({ summary: '添加进度备注' })
  async addProgressNote(
    @Param('repairOrderId') repairOrderId: string,
    @Body() body: { workerId: string; workerName: string; content: string },
  ): Promise<void> {
    const operator = {
      id: body.workerId,
      name: body.workerName,
      role: 'maintenance_worker' as const,
    };
    return this.maintenanceService.addProgressNote(repairOrderId, operator, body.content);
  }

  @Post(':repairOrderId/exception')
  @ApiOperation({ summary: '上报异常' })
  async reportException(
    @Param('repairOrderId') repairOrderId: string,
    @Body() body: { workerId: string; workerName: string; exceptionType: string; content: string },
  ): Promise<void> {
    const operator = {
      id: body.workerId,
      name: body.workerName,
      role: 'maintenance_worker' as const,
    };
    return this.maintenanceService.reportException(repairOrderId, operator, body.exceptionType, body.content);
  }
}
