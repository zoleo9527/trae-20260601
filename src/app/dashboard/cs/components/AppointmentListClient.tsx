'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { AppointmentStatus, RepairStatus } from '@/lib/enums';
import {
  APPOINTMENT_STATUS_LABELS,
  REPAIR_STATUS_LABELS,
  REPAIR_STATUS_COLORS,
  formatDate,
} from '@/lib/status';

interface AppointmentItem {
  id: string;
  scheduledDate: string;
  timeSlot: string;
  note: string | null;
  status: string;
  engineer: { id: string; name: string } | null;
  createdBy: { name: string };
  repairOrder: {
    id: string;
    orderNo: string;
    status: string;
    applianceType: string;
    applianceBrand: string;
    customer: { name: string; phone: string };
  };
}

interface EngineerItem {
  id: string;
  name: string;
}

interface Props {
  appointments: AppointmentItem[];
  engineers: EngineerItem[];
}

const APPOINTMENT_STATUS_COLORS: Record<string, string> = {
  [AppointmentStatus.SCHEDULED]: 'bg-blue-100 text-blue-700',
  [AppointmentStatus.CONFIRMED]: 'bg-green-100 text-green-700',
  [AppointmentStatus.IN_PROGRESS]: 'bg-yellow-100 text-yellow-700',
  [AppointmentStatus.COMPLETED]: 'bg-gray-100 text-gray-600',
  [AppointmentStatus.RESCHEDULED]: 'bg-purple-100 text-purple-700',
  [AppointmentStatus.CANCELLED]: 'bg-red-100 text-red-700',
};

function toLocalDateString(d: Date | string): string {
  const date = new Date(d);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function AppointmentListClient({ appointments, engineers }: Props) {
  const todayStr = toLocalDateString(new Date());

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [engineerFilter, setEngineerFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const filtered = useMemo(() => {
    let list = [...appointments];

    if (dateFrom) {
      list = list.filter((a) => toLocalDateString(a.scheduledDate) >= dateFrom);
    }
    if (dateTo) {
      list = list.filter((a) => toLocalDateString(a.scheduledDate) <= dateTo);
    }
    if (engineerFilter) {
      list = list.filter((a) => a.engineer?.id === engineerFilter);
    }
    if (statusFilter) {
      list = list.filter((a) => a.status === statusFilter);
    }

    list.sort((a, b) => {
      const da = new Date(a.scheduledDate).getTime();
      const db = new Date(b.scheduledDate).getTime();
      if (da !== db) return db - da;
      return a.timeSlot.localeCompare(b.timeSlot);
    });

    return list;
  }, [appointments, dateFrom, dateTo, engineerFilter, statusFilter]);

  const stats = useMemo(() => {
    const today = appointments.filter(
      (a) => toLocalDateString(a.scheduledDate) === todayStr
    );
    const pendingVisit = appointments.filter(
      (a) =>
        a.status !== AppointmentStatus.CANCELLED &&
        a.status !== AppointmentStatus.COMPLETED &&
        toLocalDateString(a.scheduledDate) >= todayStr
    );
    const completed = appointments.filter(
      (a) => a.status === AppointmentStatus.COMPLETED
    );
    return {
      todayCount: today.length,
      pendingVisitCount: pendingVisit.length,
      completedCount: completed.length,
      totalCount: appointments.length,
    };
  }, [appointments, todayStr]);

  const isToday = (d: string) => toLocalDateString(d) === todayStr;
  const isPendingVisit = (a: AppointmentItem) =>
    a.status !== AppointmentStatus.CANCELLED &&
    a.status !== AppointmentStatus.COMPLETED &&
    toLocalDateString(a.scheduledDate) >= todayStr;

  const hasFilter = dateFrom || dateTo || engineerFilter || statusFilter;

  const resetFilters = () => {
    setDateFrom('');
    setDateTo('');
    setEngineerFilter('');
    setStatusFilter('');
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <div className={`card ${stats.todayCount > 0 ? 'bg-blue-50 border-blue-200 ring-2 ring-blue-200' : 'bg-gray-50 border-gray-100'}`}>
          <div className="text-sm text-blue-700 font-medium">今日预约</div>
          <div className="text-3xl font-bold text-blue-900 mt-1">{stats.todayCount}</div>
          <div className="text-xs text-blue-500 mt-1">{stats.todayCount > 0 ? '请关注今日安排' : '今日暂无预约'}</div>
        </div>
        <div className={`card ${stats.pendingVisitCount > 0 ? 'bg-amber-50 border-amber-200 ring-2 ring-amber-200' : 'bg-gray-50 border-gray-100'}`}>
          <div className="text-sm text-amber-700 font-medium">待上门</div>
          <div className="text-3xl font-bold text-amber-900 mt-1">{stats.pendingVisitCount}</div>
          <div className="text-xs text-amber-500 mt-1">含今日及之后未完成</div>
        </div>
        <div className="card bg-green-50 border-green-100">
          <div className="text-sm text-green-700">已完成</div>
          <div className="text-3xl font-bold text-green-900 mt-1">{stats.completedCount}</div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-500">全部预约</div>
          <div className="text-3xl font-bold text-gray-900 mt-1">{stats.totalCount}</div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-end gap-4 flex-wrap pb-4 border-b border-gray-100">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">开始日期</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="input text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">结束日期</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="input text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">工程师</label>
            <select
              value={engineerFilter}
              onChange={(e) => setEngineerFilter(e.target.value)}
              className="select text-sm"
            >
              <option value="">全部工程师</option>
              {engineers.map((eng) => (
                <option key={eng.id} value={eng.id}>{eng.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">预约状态</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="select text-sm"
            >
              <option value="">全部状态</option>
              {Object.values(AppointmentStatus).map((s) => (
                <option key={s} value={s}>{APPOINTMENT_STATUS_LABELS[s]}</option>
              ))}
            </select>
          </div>
          {hasFilter && (
            <button
              onClick={resetFilters}
              className="btn-secondary text-sm"
            >
              重置筛选
            </button>
          )}
          <div className="ml-auto text-sm text-gray-400">
            共 {filtered.length} 条记录
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">日期</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">时间段</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">工单</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">客户</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">家电</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">工程师</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">预约状态</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">工单状态</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-400">
                    {hasFilter ? '无匹配的预约记录，请调整筛选条件' : '暂无预约记录'}
                  </td>
                </tr>
              ) : (
                filtered.map((apt) => {
                  const todayRow = isToday(apt.scheduledDate);
                  const pending = isPendingVisit(apt);
                  return (
                    <tr
                      key={apt.id}
                      className={`border-b border-gray-50 hover:bg-gray-50 ${
                        todayRow && pending ? 'bg-blue-50/60' : ''
                      } ${todayRow && !pending ? 'bg-blue-50/30' : ''} ${
                        !todayRow && pending ? 'bg-amber-50/40' : ''
                      }`}
                    >
                      <td className="px-6 py-4 text-sm">
                        <span className={todayRow ? 'font-bold text-blue-700' : 'text-gray-900'}>
                          {formatDate(apt.scheduledDate)}
                        </span>
                        {todayRow && (
                          <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-600 text-white">
                            今日
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 font-medium">{apt.timeSlot}</td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm text-gray-900">{apt.repairOrder.orderNo}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900 text-sm">{apt.repairOrder.customer.name}</div>
                        <div className="text-xs text-gray-500">{apt.repairOrder.customer.phone}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {apt.repairOrder.applianceBrand} {apt.repairOrder.applianceType}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{apt.engineer?.name || '未指派'}</td>
                      <td className="px-6 py-4">
                        <span className={`badge ${APPOINTMENT_STATUS_COLORS[apt.status] || 'bg-gray-100 text-gray-600'}`}>
                          {APPOINTMENT_STATUS_LABELS[apt.status as AppointmentStatus] || apt.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`badge ${REPAIR_STATUS_COLORS[apt.repairOrder.status as RepairStatus] || ''}`}>
                          {REPAIR_STATUS_LABELS[apt.repairOrder.status as RepairStatus] || apt.repairOrder.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/dashboard/cs/orders/${apt.repairOrder.id}`}
                          className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                        >
                          查看工单
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
