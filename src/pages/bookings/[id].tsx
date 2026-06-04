import { GetServerSideProps } from 'next';
import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { GroupBooking, Personnel, Timeline as TimelineType, PersonnelImport, ExceptionRecord } from '@prisma/client';
import prisma from '@/lib/db';
import { requireAuth, serializeUser } from '@/lib/auth';
import Layout, { StatusBadge } from '@/components/Layout';
import Timeline from '@/components/Timeline';

interface BookingDetailProps {
  user: ReturnType<typeof serializeUser>;
  booking: GroupBooking & {
    createdBy: { name: string; role: string };
    handledBy?: { name: string; role: string } | null;
    personnel: Personnel[];
    imports: (PersonnelImport & {
      createdBy: { name: string; role: string };
    })[];
    timelines: (TimelineType & {
      createdBy: { name: string; role: string };
    })[];
    exceptions: (ExceptionRecord & {
      handledBy?: { name: string; role: string } | null;
    })[];
  };
  personnelCount: number;
}

const exceptionTypes = [
  { value: 'PERSONNEL_CHANGE', label: '人员变更' },
  { value: 'DATE_CONFLICT', label: '日期冲突' },
  { value: 'DATA_ERROR', label: '数据错误' },
  { value: 'PACKAGE_ADJUST', label: '套餐调整' },
  { value: 'OTHER', label: '其他异常' },
];

export default function BookingDetailPage({ user, booking, personnelCount }: BookingDetailProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'overview' | 'personnel' | 'imports' | 'exceptions' | 'timeline'>('overview');
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showExceptionModal, setShowExceptionModal] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [exceptionType, setExceptionType] = useState('PERSONNEL_CHANGE');
  const [exceptionDesc, setExceptionDesc] = useState('');
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!confirm('确认要通过此预约吗？')) return;
    setLoading(true);
    try {
      await fetch(`/api/bookings/${booking.id}/confirm`, { method: 'POST' });
      router.reload();
    } catch (error) {
      alert('操作失败');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      alert('请输入驳回原因');
      return;
    }
    setLoading(true);
    try {
      await fetch(`/api/bookings/${booking.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason }),
      });
      router.reload();
    } catch (error) {
      alert('操作失败');
    } finally {
      setLoading(false);
      setShowRejectModal(false);
    }
  };

  const handleReschedule = async () => {
    if (!newDate) {
      alert('请选择新的日期');
      return;
    }
    setLoading(true);
    try {
      await fetch(`/api/bookings/${booking.id}/reschedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newDate }),
      });
      router.reload();
    } catch (error) {
      alert('操作失败');
    } finally {
      setLoading(false);
      setShowRescheduleModal(false);
    }
  };

  const handleResetData = async () => {
    if (!confirm('确定要重置该预约的人员数据吗？此操作不可恢复！')) return;
    setLoading(true);
    try {
      await fetch(`/api/bookings/${booking.id}/reset`, { method: 'POST' });
      router.reload();
    } catch (error) {
      alert('操作失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAddException = async () => {
    if (!exceptionDesc.trim()) {
      alert('请输入异常说明');
      return;
    }
    setLoading(true);
    try {
      await fetch(`/api/bookings/${booking.id}/exception`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: exceptionType, description: exceptionDesc }),
      });
      router.reload();
    } catch (error) {
      alert('操作失败');
    } finally {
      setLoading(false);
      setShowExceptionModal(false);
      setExceptionDesc('');
    }
  };

  const handleMarkExceptionHandled = async (exceptionId: string) => {
    if (!confirm('确定要标记此异常为已处理吗？')) return;
    setLoading(true);
    try {
      await fetch(`/api/bookings/${booking.id}/exception`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exceptionId }),
      });
      router.reload();
    } catch (error) {
      alert('操作失败');
    } finally {
      setLoading(false);
    }
  };

  const unhandledExceptions = booking.exceptions.filter((e) => !e.isHandled);

  return (
    <Layout user={user} title={`${booking.companyName} - 预约详情`}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/" className="text-gray-500 hover:text-gray-700">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{booking.companyName}</h1>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-sm text-gray-500 font-mono">{booking.bookingNo}</span>
                <StatusBadge status={booking.status} />
                {unhandledExceptions.length > 0 && (
                  <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-700 font-medium">
                    {unhandledExceptions.length} 项未处理异常
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {booking.status === 'PENDING' && user.role === 'ADMIN' && (
              <>
                <button
                  onClick={handleConfirm}
                  disabled={loading}
                  className="px-4 py-2 bg-green-500 text-white font-medium rounded-lg hover:bg-green-600 transition disabled:opacity-50"
                >
                  确认预约
                </button>
                <button
                  onClick={() => setShowRejectModal(true)}
                  disabled={loading}
                  className="px-4 py-2 bg-red-500 text-white font-medium rounded-lg hover:bg-red-600 transition disabled:opacity-50"
                >
                  驳回
                </button>
              </>
            )}
            {(booking.status === 'CONFIRMED' || booking.status === 'PENDING' || booking.status === 'SUPPLEMENTED') && (
              <button
                onClick={() => setShowRescheduleModal(true)}
                disabled={loading}
                className="px-4 py-2 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 transition disabled:opacity-50"
              >
                改期
              </button>
            )}
            <button
              onClick={() => setShowExceptionModal(true)}
              disabled={loading}
              className="px-4 py-2 bg-amber-500 text-white font-medium rounded-lg hover:bg-amber-600 transition disabled:opacity-50"
            >
              异常说明
            </button>
            <Link
              href={`/bookings/${booking.id}/import`}
              className="px-4 py-2 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition"
            >
              {booking.status === 'CONFIRMED' || booking.status === 'RESCHEDULED' || booking.status === 'SUPPLEMENTED' ? '补录人员' : '导入人员'}
            </Link>
            {personnelCount > 0 && (
              <button
                onClick={handleResetData}
                disabled={loading}
                className="px-4 py-2 bg-gray-500 text-white font-medium rounded-lg hover:bg-gray-600 transition disabled:opacity-50"
              >
                重置数据
              </button>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="border-b border-gray-100">
            <nav className="flex space-x-8 px-6">
              {[
                { key: 'overview', label: '概览' },
                { key: 'personnel', label: `人员名单 (${personnelCount})` },
                { key: 'imports', label: `导入记录 (${booking.imports.length})` },
                { key: 'exceptions', label: `异常说明 (${unhandledExceptions.length}/${booking.exceptions.length})` },
                { key: 'timeline', label: '时间线' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as typeof activeTab)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition ${
                    activeTab === tab.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">基本信息</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-500">单位名称</span>
                      <span className="font-medium">{booking.companyName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">联系人</span>
                      <span className="font-medium">{booking.contactPerson}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">联系电话</span>
                      <span className="font-medium">{booking.contactPhone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">预约日期</span>
                      <span className="font-medium">
                        {format(new Date(booking.scheduledDate), 'yyyy年MM月dd日', { locale: zhCN })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">套餐类型</span>
                      <span className="font-medium">{booking.packageType || '-'}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">统计信息</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-500">预计人数</span>
                      <span className="font-medium">{booking.expectedCount} 人</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">已导入人数</span>
                      <span className="font-medium">{personnelCount} 人</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">单价</span>
                      <span className="font-medium">¥{booking.pricePerPerson?.toString() || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">总金额</span>
                      <span className="font-medium text-lg text-blue-600">¥{booking.totalAmount?.toString() || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">创建人</span>
                      <span className="font-medium">{booking.createdBy.name}</span>
                    </div>
                    {booking.handledBy && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">处理人</span>
                        <span className="font-medium text-blue-600">{booking.handledBy.name}
                          <span className="text-xs text-gray-400 ml-1">({booking.handledBy.role === 'ADMIN' ? '管理员' : '前台'})</span>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                {booking.remark && (
                  <div className="md:col-span-2">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">备注</h3>
                    <div className="bg-gray-50 rounded-lg p-4 text-gray-700">
                      {booking.remark}
                    </div>
                  </div>
                )}
                {unhandledExceptions.length > 0 && (
                  <div className="md:col-span-2">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">未处理异常</h3>
                    <div className="space-y-2">
                      {unhandledExceptions.map((ex) => (
                        <div key={ex.id} className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center justify-between">
                          <div>
                            <span className="text-xs font-medium text-red-600 bg-red-100 px-2 py-0.5 rounded-full mr-2">
                              {exceptionTypes.find((t) => t.value === ex.type)?.label || ex.type}
                            </span>
                            <span className="text-sm text-gray-800">{ex.description}</span>
                          </div>
                          <button
                            onClick={() => handleMarkExceptionHandled(ex.id)}
                            className="text-xs text-green-600 hover:text-green-700 font-medium"
                          >
                            标记已处理
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'personnel' && (
              <div>
                {booking.personnel.length === 0 ? (
                  <div className="text-center py-12">
                    <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <p className="text-gray-500 mb-4">暂无人员数据</p>
                    <Link
                      href={`/bookings/${booking.id}/import`}
                      className="inline-flex items-center px-4 py-2 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition"
                    >
                      导入人员
                    </Link>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">姓名</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">性别</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">年龄</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">部门</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">职位</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {booking.personnel.map((p) => (
                          <tr key={p.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{p.name}</td>
                            <td className="px-4 py-3 text-sm text-gray-500">{p.gender || '-'}</td>
                            <td className="px-4 py-3 text-sm text-gray-500">{p.age || '-'}</td>
                            <td className="px-4 py-3 text-sm text-gray-500">{p.department || '-'}</td>
                            <td className="px-4 py-3 text-sm text-gray-500">{p.position || '-'}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 text-xs rounded-full ${p.isCompleted ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                {p.isCompleted ? '已体检' : '待体检'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'imports' && (
              <div>
                {booking.imports.length === 0 ? (
                  <div className="text-center py-12">
                    <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-gray-500">暂无导入记录</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {booking.imports.map((imp) => (
                      <div key={imp.id} className="border border-gray-100 rounded-lg p-4 flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{imp.fileName}</p>
                          <p className="text-sm text-gray-500">
                            导入人：{imp.createdBy.name} · 
                            {format(new Date(imp.createdAt), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
                          </p>
                        </div>
                        <div className="flex items-center space-x-6">
                          <div className="text-center">
                            <p className="text-lg font-bold text-gray-900">{imp.totalCount}</p>
                            <p className="text-xs text-gray-500">总数</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-bold text-green-600">{imp.successCount}</p>
                            <p className="text-xs text-gray-500">成功</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-bold text-red-600">{imp.failCount}</p>
                            <p className="text-xs text-gray-500">失败</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${imp.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {imp.status === 'COMPLETED' ? '完成' : '处理中'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'exceptions' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">异常说明记录</h3>
                  <button
                    onClick={() => setShowExceptionModal(true)}
                    className="px-4 py-2 bg-amber-500 text-white font-medium rounded-lg hover:bg-amber-600 transition"
                  >
                    添加异常说明
                  </button>
                </div>
                {booking.exceptions.length === 0 ? (
                  <div className="text-center py-12">
                    <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <p className="text-gray-500">暂无异常说明</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {booking.exceptions.map((ex) => (
                      <div key={ex.id} className={`border rounded-lg p-4 ${ex.isHandled ? 'border-gray-100 bg-gray-50' : 'border-red-200 bg-red-50'}`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ex.isHandled ? 'bg-gray-200 text-gray-600' : 'bg-red-100 text-red-700'}`}>
                                {exceptionTypes.find((t) => t.value === ex.type)?.label || ex.type}
                              </span>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${ex.isHandled ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                {ex.isHandled ? '已处理' : '未处理'}
                              </span>
                            </div>
                            <p className="text-sm text-gray-800 mt-1">{ex.description}</p>
                            <p className="text-xs text-gray-400 mt-2">
                              记录时间：{format(new Date(ex.createdAt), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
                            </p>
                            {ex.isHandled && ex.handledBy && ex.handledAt && (
                              <p className="text-xs text-green-600 mt-1">
                                处理人：{ex.handledBy.name} · 处理时间：{format(new Date(ex.handledAt), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
                              </p>
                            )}
                          </div>
                          {!ex.isHandled && (
                            <button
                              onClick={() => handleMarkExceptionHandled(ex.id)}
                              disabled={loading}
                              className="ml-4 px-3 py-1.5 text-xs bg-green-500 text-white font-medium rounded-lg hover:bg-green-600 transition disabled:opacity-50"
                            >
                              标记已处理
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'timeline' && (
              <Timeline items={booking.timelines.map((t) => ({
                ...t,
                createdAt: new Date(t.createdAt),
              }))} />
            )}
          </div>
        </div>
      </div>

      {showRescheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">改期预约</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">新的预约日期</label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowRescheduleModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                >
                  取消
                </button>
                <button
                  onClick={handleReschedule}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50"
                >
                  确认改期
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">驳回预约</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">驳回原因</label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  rows={4}
                  placeholder="请输入驳回原因..."
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                >
                  取消
                </button>
                <button
                  onClick={handleReject}
                  disabled={loading}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition disabled:opacity-50"
                >
                  确认驳回
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showExceptionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">添加异常说明</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">异常类型</label>
                <select
                  value={exceptionType}
                  onChange={(e) => setExceptionType(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  {exceptionTypes.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">异常说明</label>
                <textarea
                  value={exceptionDesc}
                  onChange={(e) => setExceptionDesc(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  rows={4}
                  placeholder="请输入异常说明..."
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => { setShowExceptionModal(false); setExceptionDesc(''); }}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                >
                  取消
                </button>
                <button
                  onClick={handleAddException}
                  disabled={loading}
                  className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition disabled:opacity-50"
                >
                  确认添加
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const authResult = await requireAuth(context);
  if ('redirect' in authResult) {
    return { redirect: authResult.redirect };
  }

  const { id } = context.params as { id: string };

  const booking = await prisma.groupBooking.findUnique({
    where: { id },
    include: {
      createdBy: { select: { name: true, role: true } },
      handledBy: { select: { name: true, role: true } },
      personnel: { orderBy: { createdAt: 'desc' } },
      imports: {
        include: { createdBy: { select: { name: true, role: true } } },
        orderBy: { createdAt: 'desc' },
      },
      timelines: {
        include: { createdBy: { select: { name: true, role: true } } },
        orderBy: { createdAt: 'desc' },
      },
      exceptions: {
        include: { handledBy: { select: { name: true, role: true } } },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!booking) {
    return { notFound: true };
  }

  const personnelCount = booking.personnel.length;

  return {
    props: {
      user: serializeUser(authResult.user),
      booking: JSON.parse(JSON.stringify(booking)),
      personnelCount,
    },
  };
};
