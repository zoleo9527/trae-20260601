import { Controller, Get, Post, Body, Param, Query, Put } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { RepairService } from './repair.service';
import { CreateRepairDto } from './dto/create-repair.dto';
import { RepairOrder, RepairStatus } from './interfaces/repair.interface';
import { HistoryNote } from '../common/interfaces/history-note.interface';

@ApiTags('repair')
@Controller('api/repairs')
export class RepairController {
  constructor(private readonly repairService: RepairService) {}

  @Post()
  @ApiOperation({ summary: '创建报修单（宿管）' })
  async create(@Body() createDto: CreateRepairDto): Promise<RepairOrder> {
    const operator = {
      id: createDto.reporterId,
      name: createDto.reporterName,
      role: 'dorm_manager' as const,
    };
    return this.repairService.create(createDto, operator);
  }

  @Get()
  @ApiOperation({ summary: '获取报修单列表' })
  @ApiQuery({ name: 'status', required: false, enum: ['pending', 'dispatched', 'accepted', 'in_progress', 'completed', 'cancelled'] })
  @ApiQuery({ name: 'reporterId', required: false })
  async findAll(
    @Query('status') status?: RepairStatus,
    @Query('reporterId') reporterId?: string,
  ): Promise<RepairOrder[]> {
    return this.repairService.findAll({ status, reporterId });
  }

  @Get(':id')
  @ApiOperation({ summary: '获取报修单详情' })
  async findOne(@Param('id') id: string): Promise<RepairOrder> {
    return this.repairService.findOne(id);
  }

  @Get(':id/history')
  @ApiOperation({ summary: '获取报修单历史记录' })
  async getHistory(@Param('id') id: string): Promise<HistoryNote[]> {
    return this.repairService.getHistory(id);
  }

  @Put(':id/mark-responsibility')
  @ApiOperation({ summary: '标记责任不清' })
  async markResponsibility(
    @Param('id') id: string,
    @Body() body: { note: string; operatorId: string; operatorName: string },
  ): Promise<RepairOrder> {
    const operator = {
      id: body.operatorId,
      name: body.operatorName,
      role: 'dorm_manager' as const,
    };
    return this.repairService.markResponsibility(id, body.note, operator);
  }
}
