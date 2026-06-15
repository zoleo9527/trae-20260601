import DashboardShell from '../../../components/DashboardShell';
import { requireRole } from '@/lib/auth';
import { Role } from '@/lib/enums';
import prisma from '@/lib/prisma';
import OrderDetailClient from '../../components/OrderDetailClient';
import { notFound } from 'next/navigation';

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const user = await requireRole([Role.CUSTOMER_SERVICE]);

  const order = await prisma.repairOrder.findUnique({
    where: { id: params.id },
    include: {
      customer: true,
      acceptedBy: true,
      assignedTo: true,
      closedBy: true,
      statusLogs: {
        include: { operator: true },
        orderBy: { createdAt: 'asc' },
      },
      appointments: {
        include: { engineer: true, createdBy: true },
        orderBy: { createdAt: 'desc' },
      },
      partRequests: {
        include: {
          requestedBy: true,
          approvedBy: true,
          items: {
            include: { part: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!order) {
    notFound();
  }

  const engineers = await prisma.user.findMany({
    where: { role: Role.ENGINEER },
    select: { id: true, name: true, role: true },
  });

  return (
    <DashboardShell user={user}>
      <OrderDetailClient order={order} engineers={engineers} />
    </DashboardShell>
  );
}
