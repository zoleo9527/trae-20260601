'use server';

import { login, createSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Role } from '@/lib/enums';

export async function loginAction(formData: FormData) {
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;

  if (!username || !password) {
    return { error: '请输入用户名和密码' };
  }

  const user = await login(username, password);

  if (!user) {
    return { error: '用户名或密码错误' };
  }

  createSession(user.id);

  const dashboardMap: Record<Role, string> = {
    [Role.CUSTOMER_SERVICE]: '/dashboard/cs',
    [Role.ENGINEER]: '/dashboard/engineer',
    [Role.PARTS_ADMIN]: '/dashboard/parts',
  };

  redirect(dashboardMap[user.role]);
}
