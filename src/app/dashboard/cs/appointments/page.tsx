import DashboardShell from '../../components/DashboardShell';
import { requireRole } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Role } from '@/lib/enums';
import AppointmentListClient from '../components/AppointmentListClient';

export default async function AppointmentsPage() {
  const user = await requireRole([Role.CUSTOMER_SERVICE]);

  const [appointments, engineers] = await Promise.all([
    prisma.appointment.findMany({
      include: {
        repairOrder: { include: { customer: true } },
        engineer: { select: { id: true, name: true } },
        createdBy: { select: { name: true } },
      },
      orderBy: { scheduledDate: 'desc' },
    }),
    prisma.user.findMany({
      where: { role: Role.ENGINEER },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ]);

  const serialized = appointments.map((apt) => ({
    id: apt.id,
    scheduledDate: apt.scheduledDate.toISOString(),
    timeSlot: apt.timeSlot,
    note: apt.note,
    status: apt.status,
    engineer: apt.engineer ? { id: apt.engineer.id, name: apt.engineer.name } : null,
    createdBy: { name: apt.createdBy.name },
    repairOrder: {
      id: apt.repairOrder.id,
      orderNo: apt.repairOrder.orderNo,
      status: apt.repairOrder.status,
      applianceType: apt.repairOrder.applianceType,
      applianceBrand: apt.repairOrder.applianceBrand,
      customer: {
        name: apt.repairOrder.customer.name,
        phone: apt.repairOrder.customer.phone,
      },
    },
  }));

  return (
    <DashboardShell user={user}>
      <AppointmentListClient appointments={serialized} engineers={engineers} />
    </DashboardShell>
  );
}
