import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Gift, Plus, Clock, CheckCircle, Wine, AlertTriangle } from 'lucide-react';
import { usePackageStore } from '../stores/packageStore';
import { useBookingStore } from '../stores/bookingStore';
import { useAnomalyStore } from '../stores/anomalyStore';
import { StatusBadge, SeverityBadge } from '../components/StatusBadge';
import { formatDateTime, formatTime } from '../utils/storage';
import { PackageOrderStatus } from '../types';

const PackageList: React.FC = () => {
  const navigate = useNavigate();
  const { packages, packageOrders, getPackageById } = usePackageStore();
  const { getBookingById } = useBookingStore();
  const { getAnomaliesByOrderId } = useAnomalyStore();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">生日套餐管理</h2>
        <button
          onClick={() => navigate('/packages/process')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          套餐订单处理
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {packages.filter((p) => p.active).map((pkg) => (
          <div
            key={pkg.id}
            className="bg-slate-900 border border-slate-800 rounded-lg p-5 hover:border-slate-700 transition-colors"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <Gift className="w-6 h-6 text-blue-400" />
              </div>
              <span className="text-2xl font-bold text-emerald-400">¥{pkg.price}</span>
            </div>
            <h3 className="font-semibold text-lg mb-2">{pkg.name}</h3>
            <p className="text-slate-400 text-sm mb-4">{pkg.description}</p>
            <div className="border-t border-slate-800 pt-4">
              <p className="text-xs text-slate-400 mb-2">赠送酒水：</p>
              <div className="flex flex-wrap gap-2">
                {pkg.drinkGifts.map((gift, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-slate-800 rounded text-xs"
                  >
                    <Wine className="w-3 h-3 text-amber-400" />
                    {gift.name} x{gift.quantity}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800">
          <h3 className="font-semibold">套餐订单记录</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left px-5 py-3 font-medium text-slate-400">订单号</th>
                <th className="text-left px-5 py-3 font-medium text-slate-400">套餐名称</th>
                <th className="text-left px-5 py-3 font-medium text-slate-400">包厢</th>
                <th className="text-left px-5 py-3 font-medium text-slate-400">客户</th>
                <th className="text-left px-5 py-3 font-medium text-slate-400">时段</th>
                <th className="text-left px-5 py-3 font-medium text-slate-400">金额</th>
                <th className="text-left px-5 py-3 font-medium text-slate-400">异常</th>
                <th className="text-left px-5 py-3 font-medium text-slate-400">操作员</th>
                <th className="text-left px-5 py-3 font-medium text-slate-400">状态</th>
                <th className="text-left px-5 py-3 font-medium text-slate-400">创建时间</th>
              </tr>
            </thead>
            <tbody>
              {packageOrders.map((order) => {
                const pkg = getPackageById(order.packageId);
                const booking = order.bookingId ? getBookingById(order.bookingId) : undefined;
                const orderAnomalies = getAnomaliesByOrderId(order.id);
                const hasOpenAnomaly = orderAnomalies.some((a) => a.status === 'open' || a.status === 'handling');
                const latestHandled = orderAnomalies.find((a) => a.handlingNote);
                return (
                  <tr
                    key={order.id}
                    onClick={() => booking && navigate(`/bookings/${booking.id}`)}
                    className={`border-b border-slate-800/50 hover:bg-slate-800/30 cursor-pointer last:border-0 ${
                      hasOpenAnomaly ? 'bg-amber-500/5' : ''
                    }`}
                  >
                    <td className="px-5 py-3 font-mono text-xs">{order.id}</td>
                    <td className="px-5 py-3">{pkg?.name || '未知套餐'}</td>
                    <td className="px-5 py-3">{booking?.roomNumber || '-'}</td>
                    <td className="px-5 py-3">{booking?.customerName || '-'}</td>
                    <td className="px-5 py-3 text-xs text-slate-400">
                      {booking ? `${formatTime(booking.startTime)}-${formatTime(booking.endTime)}` : '-'}
                    </td>
                    <td className="px-5 py-3 font-medium text-emerald-400">¥{order.actualPrice}</td>
                    <td className="px-5 py-3">
                      {orderAnomalies.length === 0 ? (
                        <span className="text-slate-600">-</span>
                      ) : (
                        <div className="flex items-center gap-1">
                          <AlertTriangle className={`w-3.5 h-3.5 ${hasOpenAnomaly ? 'text-amber-400' : 'text-emerald-400'}`} />
                          <span className={`text-xs ${hasOpenAnomaly ? 'text-amber-400' : 'text-emerald-400'}`}>
                            {orderAnomalies.length}
                          </span>
                          {latestHandled && (
                            <span className="text-xs text-slate-500 truncate max-w-[100px]" title={latestHandled.handlingNote}>
                              · {latestHandled.handlingNote}
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3 text-slate-400">{order.operator || '-'}</td>
                    <td className="px-5 py-3">
                      <StatusBadge status={order.status as PackageOrderStatus} type="package" />
                    </td>
                    <td className="px-5 py-3 text-slate-400 text-xs">
                      {formatDateTime(order.createdAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PackageList;
