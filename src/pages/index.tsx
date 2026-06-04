import { GetServerSideProps } from 'next';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { GroupBooking, Timeline as TimelineType } from '@prisma/client';
import prisma from '@/lib/db';
import { requireAuth, serializeUser } from '@/lib/auth';
import Layout, { StatusBadge } from '@/components/Layout';

const actionLabels: Record<string, string> = {
  BOOKING_CREATED: '创建预约',
  BOOKING_UPDATED: '更新预约',
  BOOKING_SUBMITTED: '提交审核',
  BOOKING_CONFIRMED: '确认预约',
  BOOKING_RESCHEDULED: '改期',
  BOOKING_SUPPLEMENTED: '补录人员',
  BOOKING_REJECTED: '驳回预约',
  BOOKING_COMPLETED: '完成体检',
  BOOKING_CANCELLED: '取消预约',
  PERSONNEL_IMPORTED: '导入人员',
  PERSONNEL_UPDATED: '更新人员',
  PERSONNEL_DELETED: '删除人员',
  EXCEPTION_ADDED: '添加异常',
  EXCEPTION_HANDLED: '处理异常',
  DATA_RESET: '重置数据',
};

const actionTagStyles: Record<string, string> = {
  BOOKING_CREATED: 'bg-blue-50 text-blue-700',
  BOOKING_SUBMITTED: 'bg-yellow-50 text-yellow-700',
  BOOKING_CONFIRMED: 'bg-green-50 text-green-700',
  BOOKING_RESCHEDULED: 'bg-orange-50 text-orange-700',
  BOOKING_SUPPLEMENTED: 'bg-purple-50 text-purple-700',
  BOOKING_REJECTED: 'bg-red-50 text-red-700',
  BOOKING_COMPLETED: 'bg-green-50 text-green-700',
  PERSONNEL_IMPORTED: 'bg-indigo-50 text-indigo-700',
  EXCEPTION_ADDED: 'bg-red-50 text-red-700',
  EXCEPTION_HANDLED: 'bg-emerald-50 text-emerald-700',
  DATA_RESET: 'bg-gray-100 text-gray-600',
};

interface BookingItem extends GroupBooking {
  _count: { personnel: number };
  createdBy: { name: string; role: string };
  handledBy?: { name: string; role: string } | null;
  latestTimeline: (TimelineType & {
    createdBy: { name: string; role: string };
  }) | null;
  unhandledExceptionCount: number;
  exceptionCount: number;
}

interface HomeProps {
  user: ReturnType<typeof serializeUser>;
  bookings: BookingItem[];
  stats: {
    total: number;
    pending: number;
    confirmed: number;
    supplemented: number;
    completed: number;
    hasException: number;
  };
}

export default function HomePage({ user, bookings, stats }: HomeProps) {
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [exceptionOnly, setExceptionOnly] = useState(false);

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      if (statusFilter !== 'ALL' && b.status !== statusFilter) return false;
      if (exceptionOnly && b.unhandledExceptionCount === 0) return false;
      return true;
    });
  }, [bookings, statusFilter, exceptionOnly]);

  return (
    <Layout user={user} title="首页 - 体检中心管理系统">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">团检预约管理</h1>
          <Link
            href="/bookings/new"
            className="inline-flex items-center px-4 py-2 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            新建预约
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-xs text-gray-500">全部</p>
                <p className="text-xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-xs text-gray-500">待审核</p>
                <p className="text-xl font-bold text-gray-900">{stats.pending}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-xs text-gray-500">已确认</p>
                <p className="text-xl font-bold text-gray-900">{stats.confirmed}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-xs text-gray-500">已补录</p>
                <p className="text-xl font-bold text-gray-900">{stats.supplemented}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-xs text-gray-500">已完成</p>
                <p className="text-xl font-bold text-gray-900">{stats.completed}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-xs text-gray-500">存在异常</p>
                <p className="text-xl font-bold text-red-600">{stats.hasException}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 flex-wrap">
                {[
                  { key: 'ALL', label: '全部' },
                  { key: 'PENDING', label: '待审核' },
                  { key: 'CONFIRMED', label: '已确认' },
                  { key: 'SUPPLEMENTED', label: '已补录' },
                  { key: 'RESCHEDULED', label: '已改期' },
                  { key: 'REJECTED', label: '已驳回' },
                ].map((s) => (
                  <button
                    key={s.key}
                    onClick={() => setStatusFilter(s.key)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                      statusFilter === s.key
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setExceptionOnly(!exceptionOnly)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition flex items-center space-x-1 ${
                  exceptionOnly
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span>{exceptionOnly ? '显示全部' : '只看异常'}</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">预约编号</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">单位名称</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">预约日期</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">人数</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">责任人</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">最近动态</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredBookings.map((booking) => {
                  const latest = booking.latestTimeline;
                  const hasUnhandled = booking.unhandledExceptionCount > 0;

                  return (
                    <tr key={booking.id} className={`hover:bg-gray-50 transition ${hasUnhandled ? 'bg-red-25' : ''}`}>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-mono text-blue-600">{booking.bookingNo}</span>
                          {hasUnhandled && (
                            <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-red-500 text-white leading-none">
                              {booking.unhandledExceptionCount}异常
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm font-medium text-gray-900">{booking.companyName}</div>
                        <div className="text-xs text-gray-500">{booking.contactPerson} · {booking.contactPhone}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {format(new Date(booking.scheduledDate), 'yyyy-MM-dd', { locale: zhCN })}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {booking._count.personnel} / {booking.expectedCount} 人
                        </div>
                        <div className="w-20 h-1.5 bg-gray-200 rounded-full mt-1">
                          <div
                            className="h-1.5 bg-blue-500 rounded-full"
                            style={{ width: `${Math.min(100, (booking._count.personnel / booking.expectedCount) * 100)}%` }}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <StatusBadge status={booking.status} />
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {booking.handledBy ? (
                          <div>
                            <div className="text-sm font-medium text-gray-900">{booking.handledBy.name}</div>
                            <div className="text-xs text-gray-400">{booking.handledBy.role === 'ADMIN' ? '管理员' : '前台'}</div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        {latest ? (
                          <div className="max-w-[220px]">
                            <div className="flex items-center space-x-1.5 mb-0.5">
                              <span className={`inline-block px-1.5 py-0.5 text-[10px] font-medium rounded ${actionTagStyles[latest.action] || 'bg-gray-100 text-gray-600'}`}>
                                {actionLabels[latest.action] || latest.action}
                              </span>
                              <span className="text-[10px] text-gray-400">
                                {format(new Date(latest.createdAt), 'MM-dd HH:mm', { locale: zhCN })}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 truncate" title={latest.description}>
                              {latest.description}
                            </p>
                            <p className="text-[10px] text-gray-400 mt-0.5">
                              {latest.createdBy.name}
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          href={`/bookings/${booking.id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          查看详情
                        </Link>
                      </td>
                    </tr>
                  );
                })}
                {filteredBookings.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                      暂无数据
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const authResult = await requireAuth(context);
  if ('redirect' in authResult) {
    return { redirect: authResult.redirect };
  }

  const bookings = await prisma.groupBooking.findMany({
    include: {
      _count: {
        select: {
          personnel: true,
        },
      },
      createdBy: {
        select: { name: true, role: true },
      },
      handledBy: {
        select: { name: true, role: true },
      },
      timelines: {
        include: { createdBy: { select: { name: true, role: true } } },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
      exceptions: {
        select: { id: true, isHandled: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const bookingItems: BookingItem[] = bookings.map((b) => ({
    id: b.id,
    bookingNo: b.bookingNo,
    companyName: b.companyName,
    contactPerson: b.contactPerson,
    contactPhone: b.contactPhone,
    scheduledDate: b.scheduledDate,
    expectedCount: b.expectedCount,
    actualCount: b.actualCount,
    status: b.status,
    packageType: b.packageType,
    pricePerPerson: b.pricePerPerson,
    totalAmount: b.totalAmount,
    remark: b.remark,
    createdById: b.createdById,
    handledById: b.handledById,
    createdAt: b.createdAt,
    updatedAt: b.updatedAt,
    _count: b._count,
    createdBy: b.createdBy,
    handledBy: b.handledBy,
    latestTimeline: b.timelines[0] || null,
    unhandledExceptionCount: b.exceptions.filter((e) => !e.isHandled).length,
    exceptionCount: b.exceptions.length,
  }));

  const stats = {
    total: bookingItems.length,
    pending: bookingItems.filter((b) => b.status === 'PENDING').length,
    confirmed: bookingItems.filter((b) => b.status === 'CONFIRMED').length,
    supplemented: bookingItems.filter((b) => b.status === 'SUPPLEMENTED').length,
    completed: bookingItems.filter((b) => b.status === 'COMPLETED').length,
    hasException: bookingItems.filter((b) => b.unhandledExceptionCount > 0).length,
  };

  return {
    props: {
      user: serializeUser(authResult.user),
      bookings: JSON.parse(JSON.stringify(bookingItems)),
      stats,
    },
  };
};
