import DashboardShell from '../../components/DashboardShell';
import { requireRole } from '@/lib/auth';
import { Role } from '@/lib/enums';
import prisma from '@/lib/prisma';
import EngineerOrderDetailClient from '../components/EngineerOrderDetailClient';
import { notFound } from 'next/navigation';

export default async function EngineerOrderDetailPage({ params }: { params: { id: string } }) {
  const user = await requireRole([Role.ENGINEER]);

  const order = await prisma.repairOrder.findUnique({
    where: { id: params.id },
    include: {
      customer: true,
      acceptedBy: true,
      assignedTo: true,
      statusLogs: {
        include: { operator: true },
        orderBy: { createdAt: 'asc' },
      },
      appointments: {
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

  if (!order || order.assignedToId !== user.id) {
    notFound();
  }

  const parts = await prisma.part.findMany({
    where: { stock: { gt: 0 } },
    orderBy: { category: 'asc' },
  });

  return (
    <DashboardShell user={user}>
      <EngineerOrderDetailClient order={order} parts={parts} />
    </DashboardShell>
  );
}
