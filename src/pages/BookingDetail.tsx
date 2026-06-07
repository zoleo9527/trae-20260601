import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Clock,
  User,
  Phone,
  Calendar,
  Gift,
  Sparkles,
  ChevronRight,
  Plus,
  AlertTriangle,
  MessageSquare,
  Edit3
} from 'lucide-react';
import { useBookingStore } from '../stores/bookingStore';
import { usePackageStore } from '../stores/packageStore';
import { useDecorationStore } from '../stores/decorationStore';
import { useAnomalyStore } from '../stores/anomalyStore';
import { useAuditStore } from '../stores/auditStore';
import { StatusBadge } from '../components/StatusBadge';
import { formatDateTime, formatTime } from '../utils/storage';
import { BookingStatus } from '../types';

const BookingDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getBookingById, updateBookingStatus, checkRoomConflict } = useBookingStore();
  const { getPackageOrdersByBooking, packages } = usePackageStore();
  const { getTasksByBooking } = useDecorationStore();
  const { getAnomaliesByBookingId } = useAnomalyStore();
  const { getLogsByEntity } = useAuditStore();
  const [statusNote, setStatusNote] = useState('');
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  const booking = getBookingById(id!);
  const packageOrder = booking?.packageOrderId ? getPackageOrdersByBooking(booking.id) : undefined;
  const pkg = packageOrder ? packages.find((p) => p.id === packageOrder.packageId) : undefined;
  const decorationTask = booking?.decorationTaskId ? getTasksByBooking(booking.id) : undefined;
  const relatedAnomalies = booking ? getAnomaliesByBookingId(booking.id) : [];
  const auditLogs = id ? getLogsByEntity('booking', id) : [];

  if (!booking) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">预订不存在</p>
        <button
          onClick={() => navigate('/bookings')}
          className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
        >
          返回预订列表
        </button>
      </div>
    );
  }

  const statusFlow: { status: BookingStatus; label: string; next: BookingStatus[] }[] = [
    { status: 'pending', label: '待确认', next: ['confirmed', 'cancelled'] },
    { status: 'confirmed', label: '已确认', next: ['checked_in', 'cancelled'] },
    { status: 'checked_in', label: '已到店', next: ['completed'] },
    { status: 'completed', label: '已完成', next: [] },
    { status: 'cancelled', label: '已取消', next: [] },
  ];

  const currentFlow = statusFlow.find((f) => f.status === booking.status);
  const conflicts = checkRoomConflict(booking.roomNumber, booking.startTime, booking.endTime, booking.id);

  const handleStatusChange = (newStatus: BookingStatus) => {
    updateBookingStatus(booking.id, newStatus, statusNote || undefined);
    setStatusNote('');
    setShowStatusMenu(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/bookings')}
          className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold">预订详情</h2>
            <StatusBadge status={booking.status} type="booking" />
            <span className="text-xs text-slate-500 font-mono">{booking.id}</span>
          </div>
        </div>
        {currentFlow && currentFlow.next.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setShowStatusMenu(!showStatusMenu)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Edit3 className="w-4 h-4" />
              变更状态
              <ChevronRight className={`w-4 h-4 transition-transform ${showStatusMenu ? 'rotate-90' : ''}`} />
            </button>
            {showStatusMenu && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-10 p-4">
                <div className="mb-3">
                  <label className="text-xs text-slate-400 mb-1 block">变更说明（可选）</label>
                  <input
                    type="text"
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                    placeholder="输入说明..."
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  {currentFlow.next.map((nextStatus) => {
                    const nextFlow = statusFlow.find((f) => f.status === nextStatus);
                    return (
                      <button
                        key={nextStatus}
                        onClick={() => handleStatusChange(nextStatus)}
                        className="w-full text-left px-3 py-2 hover:bg-slate-800 rounded text-sm transition-colors"
                      >
                        标记为「{nextFlow?.label}」
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {conflicts.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-red-400 mb-1">包厢撞档预警</p>
              <p className="text-sm text-slate-300">
                该时段与以下预订存在冲突：
              </p>
              <div className="mt-2 space-y-1">
                {conflicts.map((c) => (
                  <div key={c.id} className="text-sm text-slate-400">
                    <Link
                      to={`/bookings/${c.id}`}
                      className="text-blue-400 hover:underline"
                    >
                      {c.customerName}
                    </Link>
                    {' · '}{formatTime(c.startTime)}-{formatTime(c.endTime)}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-400" />
              预订信息
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-400 mb-1">包厢号</p>
                <p className="font-medium">{booking.roomNumber}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">时间段</p>
                <p className="font-medium">
                  {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">客户姓名</p>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-500" />
                  <span>{booking.customerName}</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">联系电话</p>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-slate-500" />
                  <span>{booking.customerPhone}</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">创建时间</p>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-500" />
                  <span className="text-sm">{formatDateTime(booking.createdAt)}</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">更新时间</p>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-500" />
                  <span className="text-sm">{formatDateTime(booking.updatedAt)}</span>
                </div>
              </div>
            </div>
            {booking.notes && (
              <div className="mt-4 pt-4 border-t border-slate-800">
                <p className="text-xs text-slate-400 mb-1">备注</p>
                <p className="text-sm">{booking.notes}</p>
              </div>
            )}
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Gift className="w-5 h-5 text-emerald-400" />
                生日套餐
              </h3>
              {!packageOrder && (
                <button
                  onClick={() => navigate(`/packages/process?bookingId=${booking.id}`)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-sm transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  选择套餐
                </button>
              )}
            </div>
            {packageOrder ? (
              <div className="bg-slate-800/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-medium">{pkg?.name || '未知套餐'}</p>
                    <p className="text-emerald-400 text-sm">¥{packageOrder.actualPrice}</p>
                  </div>
                  <StatusBadge status={packageOrder.status} type="package" />
                </div>
                {pkg && (
                  <div className="border-t border-slate-700 pt-3">
                    <p className="text-xs text-slate-400 mb-2">赠送酒水：</p>
                    <div className="flex flex-wrap gap-2">
                      {packageOrder.drinkGifts.map((gift, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-slate-700 rounded text-xs"
                        >
                          {gift.name} x{gift.quantity}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="mt-3 text-xs text-slate-500">
                  操作员：{packageOrder.operator || '未记录'}
                </div>
              </div>
            ) : (
              <p className="text-slate-500 text-sm">暂未选择套餐</p>
            )}
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                包厢布置
              </h3>
              {!decorationTask && (
                <button
                  onClick={() => navigate(`/decorations/new?bookingId=${booking.id}`)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-sm transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  安排布置
                </button>
              )}
            </div>
            {decorationTask ? (
              <Link
                to={`/decorations/${decorationTask.id}`}
                className="block bg-slate-800/50 rounded-lg p-4 hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium">{decorationTask.theme}</p>
                  <StatusBadge status={decorationTask.status} type="decoration" />
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <span>照片 {decorationTask.photos.length} 张</span>
                  <span>·</span>
                  <span>操作员：{decorationTask.operator || '未分配'}</span>
                </div>
                {decorationTask.notes && (
                  <p className="mt-2 text-sm text-slate-400">{decorationTask.notes}</p>
                )}
              </Link>
            ) : (
              <p className="text-slate-500 text-sm">暂未安排布置</p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
            <h3 className="font-semibold mb-4">状态流转</h3>
            <div className="space-y-3">
              {statusFlow.map((flow, idx) => {
                const isActive = flow.status === booking.status;
                const isPast = statusFlow.findIndex((f) => f.status === booking.status) > idx;
                return (
                  <div key={flow.status} className="flex items-center gap-3">
                    <div
                      className={`w-3 h-3 rounded-full flex-shrink-0 ${
                        isActive
                          ? 'bg-blue-500 ring-4 ring-blue-500/20'
                          : isPast
                          ? 'bg-emerald-500'
                          : 'bg-slate-700'
                      }`}
                    />
                    <span
                      className={`text-sm ${
                        isActive ? 'font-medium text-white' : isPast ? 'text-slate-400' : 'text-slate-600'
                      }`}
                    >
                      {flow.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {relatedAnomalies.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                关联异常 ({relatedAnomalies.length})
              </h3>
              <div className="space-y-2">
                {relatedAnomalies.map((a) => {
                  const typeLabel = a.type === 'room_conflict' ? '包厢撞档' : a.type === 'drink_gift_issue' ? '酒水赠送' : '其他';
                  return (
                    <Link
                      key={a.id}
                      to="/anomalies"
                      className={`block p-3 rounded-lg border transition-colors ${
                        a.status === 'resolved'
                          ? 'bg-emerald-500/5 border-emerald-500/20 hover:bg-emerald-500/10'
                          : a.status === 'ignored'
                          ? 'bg-slate-800/30 border-slate-700 hover:bg-slate-800/50'
                          : a.severity === 'high'
                          ? 'bg-red-500/10 border-red-500/20 hover:bg-red-500/20'
                          : 'bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/20'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-slate-400">{typeLabel}</span>
                        <StatusBadge status={a.status} type="anomaly" />
                      </div>
                      <p className={`text-sm ${
                        a.status === 'resolved' ? 'text-emerald-300' : a.status === 'ignored' ? 'text-slate-500' : 'text-red-300'
                      }`}>{a.description}</p>
                      {a.handlingNote && (
                        <p className="text-xs text-slate-400 mt-1.5 truncate">
                          处理结果：{a.handlingNote}
                        </p>
                      )}
                      <p className="text-xs text-slate-600 mt-1">{formatDateTime(a.createdAt)}</p>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-slate-400" />
              操作记录
            </h3>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {auditLogs.length === 0 ? (
                <p className="text-slate-500 text-sm">暂无操作记录</p>
              ) : (
                auditLogs.slice(0, 10).map((log) => (
                  <div key={log.id} className="text-sm">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-slate-300">
                        {log.action === 'create' ? '创建' : log.action === 'status_change' ? '状态变更' : '更新'}
                      </span>
                      <span className="text-slate-500">·</span>
                      <span className="text-slate-500 text-xs">{log.operator || '系统'}</span>
                    </div>
                    {log.note && <p className="text-slate-400 text-xs">{log.note}</p>}
                    <p className="text-slate-600 text-xs">{formatDateTime(log.createdAt)}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingDetail;
