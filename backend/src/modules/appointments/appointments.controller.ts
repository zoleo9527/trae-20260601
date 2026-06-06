import { Controller, Get, Post, Body, Param, Query, Put } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import {
  CreateAppointmentDto,
  ApproveAppointmentDto,
  RejectAppointmentDto,
  SupplementAppointmentDto,
  AssignDockDto,
  CheckInDto,
  QueryAppointmentsDto,
} from './dto';

@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  create(@Body() dto: CreateAppointmentDto) {
    return this.appointmentsService.create(dto);
  }

  @Get()
  findAll(@Query() query: QueryAppointmentsDto) {
    return this.appointmentsService.findAll(query);
  }

  @Get('stats')
  getStats() {
    return this.appointmentsService.getStats();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.appointmentsService.findOne(id);
  }

  @Get(':id/logs')
  getStatusLogs(@Param('id') id: string) {
    return this.appointmentsService.getStatusLogs(id);
  }

  @Post(':id/approve')
  approve(@Param('id') id: string, @Body() dto: ApproveAppointmentDto) {
    return this.appointmentsService.approve(id, dto);
  }

  @Post(':id/reject')
  reject(@Param('id') id: string, @Body() dto: RejectAppointmentDto) {
    return this.appointmentsService.reject(id, dto);
  }

  @Post(':id/supplement')
  supplement(@Param('id') id: string, @Body() dto: SupplementAppointmentDto) {
    return this.appointmentsService.supplement(id, dto);
  }

  @Post(':id/assign-dock')
  assignDock(@Param('id') id: string, @Body() dto: AssignDockDto) {
    return this.appointmentsService.assignDock(id, dto);
  }

  @Post(':id/reassign-dock')
  reassignDock(@Param('id') id: string, @Body() dto: AssignDockDto) {
    return this.appointmentsService.reassignDock(id, dto);
  }

  @Post(':id/check-in')
  checkIn(@Param('id') id: string, @Body() dto: CheckInDto) {
    return this.appointmentsService.checkIn(id, dto);
  }

  @Post(':id/start-loading')
  startLoading(@Param('id') id: string, @Body() body: { operatorId: string; remark?: string }) {
    return this.appointmentsService.startLoading(id, body.operatorId, body.remark);
  }

  @Post(':id/complete')
  complete(@Param('id') id: string, @Body() body: { operatorId: string; remark?: string }) {
    return this.appointmentsService.complete(id, body.operatorId, body.remark);
  }
}
