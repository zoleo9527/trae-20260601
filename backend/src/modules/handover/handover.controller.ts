import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { HandoverService, HandoverFilters } from './handover.service';

@Controller('handovers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class HandoverController {
  constructor(private readonly handoverService: HandoverService) {}

  @Post()
  @Roles('consultant')
  submit(
    @Body() body: { propertyId: string; checklist?: any[]; issues?: string[] },
    @CurrentUser() user: any,
  ) {
    return this.handoverService.submit(
      body,
      user.sub,
      user.name,
      user.role,
    );
  }

  @Get('disputes')
  @Roles('operations', 'finance')
  getDisputes() {
    return this.handoverService.getDisputes();
  }

  @Get()
  @Roles('consultant', 'operations', 'finance')
  findAll(
    @Query() query: { propertyId?: string; status?: string; submittedBy?: string },
  ) {
    const filters: HandoverFilters = {};
    if (query.propertyId) filters.propertyId = query.propertyId;
    if (query.status) filters.status = query.status;
    if (query.submittedBy) filters.submittedBy = query.submittedBy;
    return this.handoverService.findAll(filters);
  }

  @Get(':id')
  @Roles('consultant', 'operations', 'finance')
  findOne(@Param('id') id: string) {
    return this.handoverService.findOne(id);
  }

  @Get(':id/audit-trail')
  @Roles('consultant', 'operations', 'finance')
  getAuditTrail(@Param('id') id: string) {
    return this.handoverService.getAuditTrail(id);
  }

  @Patch(':id/confirm')
  @Roles('operations')
  confirm(@Param('id') id: string, @CurrentUser() user: any) {
    return this.handoverService.confirm(id, user.sub, user.name, user.role);
  }

  @Patch(':id/dispute')
  @Roles('operations')
  dispute(
    @Param('id') id: string,
    @Body() body: { reason: string; disputedItems: string[] },
    @CurrentUser() user: any,
  ) {
    return this.handoverService.dispute(id, body, user.sub, user.name, user.role);
  }

  @Patch(':id/resolve')
  @Roles('operations')
  resolve(
    @Param('id') id: string,
    @Body() body: { resolution: string },
    @CurrentUser() user: any,
  ) {
    return this.handoverService.resolve(id, body.resolution, user.sub, user.name, user.role);
  }
}
