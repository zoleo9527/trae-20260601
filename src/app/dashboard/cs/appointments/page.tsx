import DashboardShell from '../components/DashboardShell';
import { requireRole } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Role, AppointmentStatus } from '@/lib/enums';
import {
  APPOINTMENT_STATUS_LABELS,
  REPAIR_STATUS_LABELS,
  REPAIR_STATUS_COLORS,
  formatDateTime,
  formatDate,
} from '@/lib/status';
import Link from 'next/link';

export default async function AppointmentsPage() {
  const user = await requireRole([Role.CUSTOMER_SERVICE]);

  const [upcoming, today, past] = await Promise.all([
    prisma.appointment.findMany({
      where: {
        scheduledDate: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        status: { notIn: [AppointmentStatus.CANCELLED, AppointmentStatus.COMPLETED] },
      },
      include: {
        repairOrder: { include: { customer: true } },
        engineer: true,
        createdBy: true,
      },
      orderBy: { scheduledDate: 'asc' },
    }),
    prisma.appointment.findMany({
      where: {
        scheduledDate: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lt: new Date(new Date().setHours(24, 0, 0, 0)),
        },
      },
      include: {
        repairOrder: { include: { customer: true } },
        engineer: true,
      },
      orderBy: { scheduledDate: 'asc' },
    }),
    prisma.appointment.findMany({
      where: {
        scheduledDate: { lt: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
      include: {
        repairOrder: { include: { customer: true } },
        engineer: true,
      },
      orderBy: { scheduledDate: 'desc' },
      take: 10,
    }),
  ]);

  const getStatusColor = (status: AppointmentStatus) => {
    const colors: Record<AppointmentStatus, string> = {
      [AppointmentStatus.SCHEDULED]: 'bg-blue-100 text-blue-700',
      [AppointmentStatus.CONFIRMED]: 'bg-green-100 text-green-700',
      [AppointmentStatus.IN_PROGRESS]: 'bg-yellow-100 text-yellow-700',
      [AppointmentStatus.COMPLETED]: 'bg-gray-100 text-gray-700',
      [AppointmentStatus.RESCHEDULED]: 'bg-purple-100 text-purple-700',
      [AppointmentStatus.CANCELLED]: 'bg-red-100 text-red-700',
    };
    return colors[status];
  };

  const renderAppointmentList = (items: typeof upcoming) => (
    <div className="card p-0 overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-100">
          <tr>
            <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">日期</th>
            <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">时间段</th>
            <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">工单</th>
            <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">客户</th>
            <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">工程师</th>
            <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">预约状态</th>
            <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">工单状态</th>
            <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">操作</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan={8} className="px-6 py-12 text-center text-gray-400">
                暂无记录
              </td>
            </tr>
          ) : (
            items.map((apt) => (
              <tr key={apt.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-900">{formatDate(apt.scheduledDate)}</td>
                <td className="px-6 py-4 text-sm text-gray-700 font-medium">{apt.timeSlot}</td>
                <td className="px-6 py-4 font-mono text-sm text-gray-900">{apt.repairOrder.orderNo}</td>
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900">{apt.repairOrder.customer.name}</div>
                  <div className="text-sm text-gray-500">{apt.repairOrder.customer.phone}</div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{apt.engineer?.name || '未指派'}</td>
                <td className="px-6 py-4">
                  <span className={`badge ${getStatusColor(apt.status)}`}>
                    {APPOINTMENT_STATUS_LABELS[apt.status]}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`badge ${REPAIR_STATUS_COLORS[apt.repairOrder.status]}`}>
                    {REPAIR_STATUS_LABELS[apt.repairOrder.status]}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <Link
                    href={`/dashboard/cs/orders/${apt.repairOrderId}`}
                    className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                  >
                    查看工单
                  </Link>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <DashboardShell user={user}>
      <div className="space-y-8">
        <div className="grid grid-cols-3 gap-4">
          <div className="card bg-blue-50 border-blue-100">
            <div className="text-sm text-blue-700">今日预约</div>
            <div className="text-3xl font-bold text-blue-900 mt-2">{today.length}</div>
          </div>
          <div className="card bg-green-50 border-green-100">
            <div className="text-sm text-green-700">待上门</div>
            <div className="text-3xl font-bold text-green-900 mt-2">{upcoming.length}</div>
          </div>
          <div className="card bg-gray-50 border-gray-100">
            <div className="text-sm text-gray-600">近期已完成</div>
            <div className="text-3xl font-bold text-gray-800 mt-2">
              {past.filter((p) => p.status === AppointmentStatus.COMPLETED).length}
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
            待上门预约
          </h2>
          {renderAppointmentList(upcoming)}
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">历史预约记录</h2>
          {renderAppointmentList(past)}
        </div>
      </div>
    </DashboardShell>
  );
}
