import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import prisma from './prisma';
import { Role } from '@/lib/enums';

const SESSION_COOKIE = 'repair_session';

export async function login(username: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { username },
  });

  if (!user || user.password !== password) {
    return null;
  }

  return user;
}

export function createSession(userId: string) {
  cookies().set(SESSION_COOKIE, userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
}

export function destroySession() {
  cookies().delete(SESSION_COOKIE);
}

export async function getCurrentUser() {
  const userId = cookies().get(SESSION_COOKIE)?.value;
  if (!userId) return null;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    return user;
  } catch {
    return null;
  }
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }
  return user;
}

export async function requireRole(roles: Role[]) {
  const user = await requireAuth();
  if (!roles.includes(user.role)) {
    redirect('/dashboard');
  }
  return user;
}

export function getRoleDisplayName(role: Role) {
  const map: Record<Role, string> = {
    [Role.CUSTOMER_SERVICE]: '客服',
    [Role.ENGINEER]: '维修工程师',
    [Role.PARTS_ADMIN]: '配件管理员',
  };
  return map[role];
}
