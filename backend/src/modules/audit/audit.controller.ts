import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuditService, AuditQueryFilters } from './audit.service';

@Controller('audit')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Roles('operations', 'finance')
  query(@Query() filters: AuditQueryFilters) {
    return this.auditService.query(filters);
  }

  @Get('recent')
  @Roles('operations', 'finance')
  getRecent(@Query('limit') limit: string) {
    const numLimit = limit ? parseInt(limit, 10) : 50;
    return this.auditService.getRecent(numLimit);
  }

  @Get(':entity/:id')
  @Roles('consultant', 'operations', 'finance')
  getByEntity(
    @Param('entity') entity: string,
    @Param('id') entityId: string,
  ) {
    return this.auditService.getByEntity(entity, entityId);
  }
}
