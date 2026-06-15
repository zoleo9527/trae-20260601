import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { UserService } from '../services/user.service';
import { UserRole } from '../entities/user.entity';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private userService: UserService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.headers['x-user-id'];
    
    if (!userId) {
      throw new UnauthorizedException('用户ID未提供');
    }

    try {
      const user = await this.userService.findOne(userId);
      if (!user || !user.isActive) {
        throw new UnauthorizedException('用户不存在或已禁用');
      }
      request.user = user;
      return true;
    } catch (error) {
      throw new UnauthorizedException('用户验证失败');
    }
  }
}

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private requiredRoles: UserRole[]) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    if (!user) {
      throw new UnauthorizedException('用户未登录');
    }
    
    if (!this.requiredRoles.includes(user.role)) {
      throw new UnauthorizedException('权限不足');
    }
    
    return true;
  }
}

export const DispatcherGuard = new RoleGuard([UserRole.DISPATCHER, UserRole.ADMIN]);
export const InstallerGuard = new RoleGuard([UserRole.INSTALLER, UserRole.ADMIN]);
export const CustomerServiceGuard = new RoleGuard([UserRole.CUSTOMER_SERVICE, UserRole.ADMIN]);