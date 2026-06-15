import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../common/role';

export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);
export const Permission = (permission: string) => SetMetadata('permission', permission);