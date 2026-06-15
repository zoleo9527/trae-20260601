import DashboardShell from '../../components/DashboardShell';
import { requireRole } from '@/lib/auth';
import { Role } from '@/lib/enums';
import NewRepairOrderClient from './components/NewRepairOrderClient';

export default async function NewRepairOrderPage() {
  const user = await requireRole([Role.CUSTOMER_SERVICE]);

  return (
    <DashboardShell user={user}>
      <NewRepairOrderClient />
    </DashboardShell>
  );
}
