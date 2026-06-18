
import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { AuditService } from './audit.service';
import { AuditVolunteerDto } from './dto/audit-volunteer.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('audit')
@UseGuards(JwtAuthGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Post('volunteer/:volunteerId')
  auditVolunteer(
    @Param('volunteerId') volunteerId: string,
    @Body() auditDto: AuditVolunteerDto,
    @Request() req,
  ) {
    return this.auditService.auditVolunteer(volunteerId, auditDto, req.user.userId);
  }

  @Get('volunteer/:volunteerId/history')
  getAuditHistory(@Param('volunteerId') volunteerId: string) {
    return this.auditService.getAuditHistory(volunteerId);
  }

  @Get('pending')
  getPendingAudits() {
    return this.auditService.getPendingAudits();
  }

  @Get('stats')
  getAuditStats() {
    return this.auditService.getAuditStats();
  }

  @Get('records/:recordId')
  getAuditRecordById(@Param('recordId') recordId: string) {
    return this.auditService.getAuditRecordById(recordId);
  }
}
