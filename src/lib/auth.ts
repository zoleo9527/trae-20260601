import { cookies } from 'next/headers';
import { Role } from './types';

export interface CurrentUser {
  id: number;
  name: string;
  role: Role;
  brandId?: number | null;
}

export function getCurrentUser(): CurrentUser | null {
  const cookieStore = cookies();
  const userCookie = cookieStore.get('currentUser');
  if (!userCookie?.value) return null;
  try {
    return JSON.parse(userCookie.value) as CurrentUser;
  } catch {
    return null;
  }
}

export function requireUser(): CurrentUser {
  const user = getCurrentUser();
  if (!user) {
    throw new Error('未登录');
  }
  return user;
}

export function requireRoles(allowedRoles: Role[]): CurrentUser {
  const user = requireUser();
  if (!allowedRoles.includes(user.role)) {
    throw new Error('无权限');
  }
  return user;
}
