import DashboardShell from '../components/DashboardShell';
import { requireRole } from '@/lib/auth';
import { Role } from '@/lib/enums';
import prisma from '@/lib/prisma';
import PartRequestForm from '../components/PartRequestForm';
import { notFound } from 'next/navigation';

export default async function PartsRequestPage({
  searchParams,
}: {
  searchParams: { orderId?: string };
}) {
  const user = await requireRole([Role.ENGINEER]);
  const orderId = searchParams.orderId;

  if (!orderId) {
    notFound();
  }

  const order = await prisma.repairOrder.findUnique({
    where: { id: orderId, assignedToId: user.id },
    select: { id: true, orderNo: true },
  });

  if (!order) {
    notFound();
  }

  const parts = await prisma.part.findMany({
    where: { stock: { gt: 0 } },
    orderBy: [{ category: 'asc' }, { name: 'asc' }],
  });

  return (
    <DashboardShell user={user}>
      <PartRequestForm parts={parts} orderId={order.id} orderNo={order.orderNo} />
    </DashboardShell>
  );
}
