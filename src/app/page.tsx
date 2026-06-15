import { redirect } from 'next/navigation';
import { getCurrentUser, getRoleDisplayName } from '@/lib/auth';
import { Role } from '@/lib/enums';

export default async function Home() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const dashboardMap: Record<Role, string> = {
    [Role.CUSTOMER_SERVICE]: '/dashboard/cs',
    [Role.ENGINEER]: '/dashboard/engineer',
    [Role.PARTS_ADMIN]: '/dashboard/parts',
  };

  redirect(dashboardMap[user.role]);
}
