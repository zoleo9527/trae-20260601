import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  SetMetadata,
  Injectable,
  CanActivate,
  ExecutionContext,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuditService, AuditQueryFilters } from './audit.service';
import { Reflector } from '@nestjs/core';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

@Injectable()
class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user?.role === role);
  }
}

@Controller('audit')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Roles('operations')
  query(@Query() filters: AuditQueryFilters) {
    return this.auditService.query(filters);
  }

  @Get(':entity/:id')
  getByEntity(
    @Param('entity') entity: string,
    @Param('id') entityId: string,
  ) {
    return this.auditService.getByEntity(entity, entityId);
  }
}
