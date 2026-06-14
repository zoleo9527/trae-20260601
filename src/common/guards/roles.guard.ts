import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../types/user.type';
import { InMemoryStore } from '../store/in-memory.store';

export const ROLES_KEY = 'roles';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly store: InMemoryStore,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) return true;

    const request = context.switchToHttp().getRequest();
    const userId = request.headers['x-user-id'];
    if (!userId) throw new UnauthorizedException('缺少 x-user-id 请求头');

    const user = this.store.getUser(userId);
    if (!user) throw new UnauthorizedException('用户不存在');

    request.user = user;

    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException(`当前角色[${user.role}]无权访问此接口，需要: ${requiredRoles.join(', ')}`);
    }
    return true;
  }
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly store: InMemoryStore) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const userId = request.headers['x-user-id'];
    if (!userId) throw new UnauthorizedException('缺少 x-user-id 请求头');

    const user = this.store.getUser(userId);
    if (!user) throw new UnauthorizedException('用户不存在');

    request.user = user;
    return true;
  }
}
