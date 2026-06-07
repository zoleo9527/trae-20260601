import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarClock,
  Users,
  Gift,
  Sparkles,
  AlertTriangle,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useBookingStore } from '../stores/bookingStore';
import { usePackageStore } from '../stores/packageStore';
import { useDecorationStore } from '../stores/decorationStore';
import { useAnomalyStore } from '../stores/anomalyStore';
import { useMemberStore } from '../stores/memberStore';
import { StatusBadge, SeverityBadge } from '../components/StatusBadge';
import { formatTime, formatDateTime } from '../utils/storage';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { getTodayBookings } = useBookingStore();
  const { packageOrders } = usePackageStore();
  const { getTodayTasks } = useDecorationStore();
  const { getOpenAnomalies, getAnomalyCount, runAllChecks } = useAnomalyStore();
  const { members } = useMemberStore();

  useEffect(() => {
    runAllChecks();
  }, [runAllChecks]);

  const todayBookings = getTodayBookings();
  const todayTasks = getTodayTasks();
  const todayPackages = packageOrders.filter(
    (po) => new Date(po.createdAt).toDateString() === new Date().toDateString()
  );
  const openAnomalies = getOpenAnomalies();
  const anomalyCount = getAnomalyCount();

  const stats = [
    { label: '今日预订', value: todayBookings.length, icon: CalendarClock, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: '今日套餐', value: todayPackages.length, icon: Gift, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: '布置任务', value: todayTasks.length, icon: Sparkles, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { label: '会员总数', value: members.length, icon: Users, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  ];

  const anomalyTypeLabels: Record<string, string> = {
    room_conflict: '包厢撞档',
    drink_gift_issue: '酒水赠送',
    member_balance_issue: '会员账务',
    other: '其他异常',
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-slate-900 border border-slate-800 rounded-lg p-5 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">{stat.label}</p>
                  <p className="text-3xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.bg}`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div
          onClick={() => navigate('/anomalies?type=room_conflict')}
          className="bg-red-500/10 border border-red-500/30 rounded-lg p-5 cursor-pointer hover:bg-red-500/20 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/20 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-red-400 font-medium">包厢撞档预警</p>
              <p className="text-2xl font-bold text-red-400">{anomalyCount.high}</p>
            </div>
          </div>
        </div>

        <div
          onClick={() => navigate('/anomalies?type=drink_gift_issue')}
          className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-5 cursor-pointer hover:bg-amber-500/20 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 rounded-lg">
              <AlertCircle className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-amber-400 font-medium">酒水赠送异常</p>
              <p className="text-2xl font-bold text-amber-400">{anomalyCount.medium}</p>
            </div>
          </div>
        </div>

        <div
          onClick={() => navigate('/anomalies?type=member_balance_issue')}
          className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-5 cursor-pointer hover:bg-blue-500/20 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <AlertCircle className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-blue-400 font-medium">会员账务预警</p>
              <p className="text-2xl font-bold text-blue-400">{anomalyCount.low}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-lg">
          <div className="px-5 py-4 border-b border-slate-800">
            <h3 className="font-semibold">今日预订</h3>
          </div>
          <div className="p-4 max-h-80 overflow-auto">
            {todayBookings.length === 0 ? (
              <p className="text-center text-slate-500 py-8">今日暂无预订</p>
            ) : (
              <div className="space-y-3">
                {todayBookings.slice(0, 5).map((booking) => (
                  <div
                    key={booking.id}
                    onClick={() => navigate(`/bookings/${booking.id}`)}
                    className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg cursor-pointer hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center">
                        <Clock className="w-4 h-4 text-slate-400" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{booking.customerName}</p>
                        <p className="text-xs text-slate-400">
                          包厢{booking.roomNumber} · {formatTime(booking.startTime)}-{formatTime(booking.endTime)}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={booking.status} type="booking" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg">
          <div className="px-5 py-4 border-b border-slate-800">
            <h3 className="font-semibold">待处理异常</h3>
          </div>
          <div className="p-4 max-h-80 overflow-auto">
            {openAnomalies.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                <p className="text-slate-400">暂无待处理异常</p>
              </div>
            ) : (
              <div className="space-y-3">
                {openAnomalies.slice(0, 5).map((anomaly) => (
                  <div
                    key={anomaly.id}
                    onClick={() => navigate('/anomalies')}
                    className="p-3 bg-slate-800/50 rounded-lg cursor-pointer hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <SeverityBadge severity={anomaly.severity} />
                          <span className="text-xs text-slate-400">
                            {anomalyTypeLabels[anomaly.type]}
                          </span>
                        </div>
                        <p className="text-sm text-slate-300 truncate">{anomaly.description}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          {formatDateTime(anomaly.createdAt)}
                        </p>
                      </div>
                      <StatusBadge status={anomaly.status} type="anomaly" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
