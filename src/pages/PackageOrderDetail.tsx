import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Gift,
  Wine,
  Check,
  AlertTriangle,
  Clock,
  User,
  Calendar,
  ExternalLink
} from 'lucide-react';
import { usePackageStore } from '../stores/packageStore';
import { useBookingStore } from '../stores/bookingStore';
import { useAnomalyStore } from '../stores/anomalyStore';
import { useAuditStore } from '../stores/auditStore';
import { StatusBadge } from '../components/StatusBadge';
import { formatDateTime, formatTime } from '../utils/storage';

const PackageOrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getPackageOrderById, getPackageById, updatePackageOrderStatus } = usePackageStore();
  const { getBookingById } = useBookingStore();
  const { getAnomaliesByOrderId } = useAnomalyStore();
  const { getLogsByEntity } = useAuditStore();

  const order = id ? getPackageOrderById(id) : undefined;
  const pkg = order ? getPackageById(order.packageId) : undefined;
  const booking = order?.bookingId ? getBookingById(order.bookingId) : undefined;
  const anomalies = id ? getAnomaliesByOrderId(id) : [];
  const auditLogs = id ? getLogsByEntity('package_order', id) : [];
  const hasOpenAnomaly = anomalies.some((a) => a.status === 'open' || a.status === 'handling');

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">套餐订单不存在</p>
        <button
          onClick={() => navigate('/packages')}
          className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
        >
          返回套餐管理
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/packages')}
          className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold">套餐订单详情</h2>
            <StatusBadge status={order.status} type="package" />
            <span className="text-xs text-slate-500 font-mono">{order.id}</span>
          </div>
        </div>
      </div>

      {hasOpenAnomaly && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-amber-400 mb-1">酒水赠送异常</p>
              {anomalies.filter((a) => a.status === 'open' || a.status === 'handling').map((a) => (
                <p key={a.id} className="text-sm text-slate-300">{a.description}</p>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Gift className="w-5 h-5 text-emerald-400" />
              订单信息
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-400 mb-1">套餐名称</p>
                <p className="font-medium">{pkg?.name || '未知套餐'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">实付金额</p>
                <p className="font-medium text-emerald-400">¥{order.actualPrice}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">操作员</p>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-500" />
                  <span>{order.operator || '未记录'}</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">创建时间</p>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-500" />
                  <span className="text-sm">{formatDateTime(order.createdAt)}</span>
                </div>
              </div>
            </div>

            {booking && (
              <div className="mt-4 pt-4 border-t border-slate-800">
                <p className="text-xs text-slate-400 mb-2">关联预订</p>
                <Link
                  to={`/bookings/${booking.id}`}
                  className="inline-flex items-center gap-2 px-3 py-2 bg-blue-500/10 border border-blue-500/30 rounded-lg hover:bg-blue-500/20 transition-colors"
                >
                  <Calendar className="w-4 h-4 text-blue-400" />
                  <span className="text-sm">包厢{booking.roomNumber} · {booking.customerName}</span>
                  <span className="text-xs text-slate-400">
                    {formatTime(booking.startTime)}-{formatTime(booking.endTime)}
                  </span>
                  <ExternalLink className="w-3 h-3 text-blue-400" />
                </Link>
              </div>
            )}
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Wine className="w-5 h-5 text-amber-400" />
              酒水赠送明细
            </h3>
            <div className="space-y-2">
              {order.drinkGifts.map((gift, idx) => {
                const standard = pkg?.drinkGifts.find((g) => g.name === gift.name);
                const isOver = standard && gift.quantity > standard.quantity;
                const isUnknown = !standard;
                return (
                  <div
                    key={idx}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      isOver ? 'bg-amber-500/10 border border-amber-500/30' :
                      isUnknown ? 'bg-red-500/10 border border-red-500/30' :
                      'bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Wine className={`w-4 h-4 ${isOver ? 'text-amber-400' : isUnknown ? 'text-red-400' : 'text-slate-400'}`} />
                      <span className="font-medium">{gift.name}</span>
                      {standard && (
                        <span className="text-xs text-slate-500">(标准: {standard.quantity})</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${isOver ? 'text-amber-400' : isUnknown ? 'text-red-400' : ''}`}>
                        x{gift.quantity}
                      </span>
                      {isOver && <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
                      {isUnknown && <AlertTriangle className="w-3.5 h-3.5 text-red-400" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {anomalies.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                关联异常 ({anomalies.length})
              </h3>
              <div className="space-y-2">
                {anomalies.map((a) => (
                  <Link
                    key={a.id}
                    to="/anomalies"
                    className={`block p-3 rounded-lg border transition-colors ${
                      a.status === 'resolved'
                        ? 'bg-emerald-500/5 border-emerald-500/20 hover:bg-emerald-500/10'
                        : a.status === 'ignored'
                        ? 'bg-slate-800/30 border-slate-700 hover:bg-slate-800/50'
                        : 'bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-400">酒水赠送异常</span>
                      <StatusBadge status={a.status} type="anomaly" />
                    </div>
                    <p className={`text-sm ${
                      a.status === 'resolved' ? 'text-emerald-300' : a.status === 'ignored' ? 'text-slate-500' : 'text-amber-300'
                    }`}>{a.description}</p>
                    {a.handlingNote && (
                      <p className="text-xs text-slate-400 mt-1.5 truncate">
                        处理结果：{a.handlingNote}
                      </p>
                    )}
                    <p className="text-xs text-slate-600 mt-1">{formatDateTime(a.createdAt)}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
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

export default PackageOrderDetail;
