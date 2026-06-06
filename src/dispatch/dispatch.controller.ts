import { Controller, Get, Post, Body, Param, Query, Put } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { DispatchService } from './dispatch.service';
import { CreateDispatchDto } from './dto/create-dispatch.dto';
import { DispatchRecord, DispatchStatus } from './interfaces/dispatch.interface';

@ApiTags('dispatch')
@Controller('api/dispatches')
export class DispatchController {
  constructor(private readonly dispatchService: DispatchService) {}

  @Post()
  @ApiOperation({ summary: '创建派单（后勤主管）' })
  async create(@Body() createDto: CreateDispatchDto): Promise<DispatchRecord> {
    const operator = {
      id: createDto.dispatcherId,
      name: createDto.dispatcherName,
      role: 'logistics_supervisor' as const,
    };
    return this.dispatchService.create(createDto, operator);
  }

  @Get()
  @ApiOperation({ summary: '获取派单列表' })
  @ApiQuery({ name: 'workerId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ['pending', 'dispatched', 'accepted', 'rejected', 'reassigned'] })
  async findAll(
    @Query('workerId') workerId?: string,
    @Query('status') status?: DispatchStatus,
  ): Promise<DispatchRecord[]> {
    return this.dispatchService.findAll({ workerId, status });
  }

  @Get(':id')
  @ApiOperation({ summary: '获取派单详情' })
  async findOne(@Param('id') id: string): Promise<DispatchRecord> {
    return this.dispatchService.findOne(id);
  }

  @Get('repair-order/:repairOrderId')
  @ApiOperation({ summary: '获取报修单的派单记录' })
  async findByRepairOrder(@Param('repairOrderId') repairOrderId: string): Promise<DispatchRecord[]> {
    return this.dispatchService.findByRepairOrder(repairOrderId);
  }

  @Put(':id/reassign')
  @ApiOperation({ summary: '转派工单（后勤主管）' })
  async reassign(
    @Param('id') id: string,
    @Body() body: { workerId: string; workerName: string; note: string; operatorId: string; operatorName: string },
  ): Promise<DispatchRecord> {
    const operator = {
      id: body.operatorId,
      name: body.operatorName,
      role: 'logistics_supervisor' as const,
    };
    return this.dispatchService.reassign(id, body.workerId, body.workerName, body.note, operator);
  }
}
