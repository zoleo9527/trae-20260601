import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole, RolePermissions, UserContext } from '../common/role';
import { ErrorCode, ErrorMessage } from '../common/error-code';

export const ROLES_KEY = 'roles';
export const PERMISSION_KEY = 'permission';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as UserContext;

    if (!user) {
      throw new ForbiddenException({
        code: ErrorCode.AUTH_002,
        message: ErrorMessage[ErrorCode.AUTH_002],
      });
    }

    const hasRole = requiredRoles.includes(user.role);
    if (!hasRole) {
      throw new ForbiddenException({
        code: ErrorCode.AUTH_001,
        message: ErrorMessage[ErrorCode.AUTH_001],
        details: { requiredRoles, currentRole: user.role },
      });
    }

    return true;
  }
}

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermission = this.reflector.getAllAndOverride<string>(
      PERMISSION_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (!requiredPermission) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as UserContext;

    if (!user) {
      throw new ForbiddenException({
        code: ErrorCode.AUTH_002,
        message: ErrorMessage[ErrorCode.AUTH_002],
      });
    }

    const userPermissions = RolePermissions[user.role] || [];
    const hasPermission = userPermissions.includes(requiredPermission);

    if (!hasPermission) {
      throw new ForbiddenException({
        code: ErrorCode.AUTH_003,
        message: ErrorMessage[ErrorCode.AUTH_003],
        details: { requiredPermission, userPermissions },
      });
    }

    return true;
  }
}