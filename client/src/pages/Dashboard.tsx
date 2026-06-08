import { useEffect, useState } from 'react';
import {
  Package,
  AlertTriangle,
  ArrowRight,
  Clock,
  RefreshCw,
  TrendingUp,
  MapPin,
  CalendarCheck,
} from 'lucide-react';
import { api } from '../api';
import type { DashboardStats } from '../types';
import { STATUS_LABELS, ROLE_LABELS } from '../types';
import StatusBadge from '../components/StatusBadge';

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const data = await api.logs.stats();
      setStats(data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    );
  }

  const cards = [
    {
      label: '总货单',
      value: stats.total_orders,
      icon: Package,
      color: 'bg-blue-50 text-blue-600',
      border: 'border-blue-200',
    },
    {
      label: '催办/紧急',
      value: stats.urgent_orders,
      icon: AlertTriangle,
      color: 'bg-rose-50 text-rose-600',
      border: 'border-rose-200',
    },
    {
      label: '库位变动',
      value: stats.allocation_changes,
      icon: MapPin,
      color: 'bg-orange-50 text-orange-600',
      border: 'border-orange-200',
    },
  ];

  const statusFlow = [
    { key: 'created', role: '系统' },
    { key: 'accepting', role: '货站受理' },
    { key: 'pending_security', role: '安检员' },
    { key: 'inspecting', role: '安检员' },
    { key: 'pending_allocation', role: '库区调度' },
    { key: 'allocated', role: '库区调度' },
    { key: 'appointed', role: '提货预约' },
    { key: 'picked_up', role: '完成' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">运营总览</h1>
          <p className="text-sm text-slate-500 mt-1">民航货站库位分配与提货预约实时状态</p>
        </div>
        <button
          onClick={loadStats}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm hover:bg-slate-50"
        >
          <RefreshCw className="w-4 h-4" /> 刷新
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className={`bg-white rounded-xl border ${card.border} p-5 flex items-center gap-4`}
          >
            <div className={`w-12 h-12 rounded-lg ${card.color} flex items-center justify-center`}>
              <card.icon className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-800">{card.value}</div>
              <div className="text-sm text-slate-500">{card.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-500" /> 处理流程与各状态分布
        </h2>
        <div className="flex items-center gap-1 flex-wrap">
          {statusFlow.map((step, i) => (
            <div key={step.key} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                    (stats.status_counts[step.key] || 0) > 0
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-slate-50 text-slate-400'
                  }`}
                >
                  {STATUS_LABELS[step.key]}
                  {stats.status_counts[step.key] > 0 && (
                    <span className="ml-1.5 font-bold">{stats.status_counts[step.key]}</span>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 mt-1">{step.role}</span>
              </div>
              {i < statusFlow.length - 1 && (
                <ArrowRight className="w-4 h-4 text-slate-300 mx-1 shrink-0" />
              )}
            </div>
          ))}
        </div>
        {(stats.status_counts['security_rejected'] || 0) > 0 && (
          <div className="mt-3 flex items-center gap-2 text-sm text-red-600">
            <AlertTriangle className="w-4 h-4" />
            安检退回 {stats.status_counts['security_rejected']} 单 ·
            {stats.status_counts['supplementing'] > 0 &&
              ` 补材料中 ${stats.status_counts['supplementing']} 单`}
          </div>
        )}
        {(stats.status_counts['allocation_changed'] || 0) > 0 && (
          <div className="mt-2 flex items-center gap-2 text-sm text-orange-600">
            <MapPin className="w-4 h-4" />
            库位变动 {stats.status_counts['allocation_changed']} 单，提货预约侧已感知
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-500" /> 最近状态变更
          </h2>
          <div className="space-y-3">
            {stats.recent_logs.slice(0, 8).map((log) => (
              <div key={log.id} className="flex items-start gap-3 text-sm">
                <div className="mt-1 shrink-0">
                  <StatusBadge status={log.to_status} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-700">{log.changed_by}</span>
                    <span className="text-xs text-slate-400">
                      ({ROLE_LABELS[log.role] || log.role})
                    </span>
                  </div>
                  <p className="text-slate-500 text-xs truncate">{log.notes}</p>
                </div>
                <span className="text-xs text-slate-400 shrink-0">
                  {new Date(log.created_at).toLocaleTimeString('zh-CN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-teal-500" /> 各状态数量
          </h2>
          <div className="space-y-2">
            {Object.entries(stats.status_counts)
              .sort((a, b) => b[1] - a[1])
              .map(([status, count]) => (
                <div key={status} className="flex items-center gap-3">
                  <div className="w-24 shrink-0">
                    <StatusBadge status={status} />
                  </div>
                  <div className="flex-1 bg-slate-100 rounded-full h-4 overflow-hidden">
                    <div
                      className="bg-blue-500 h-full rounded-full transition-all"
                      style={{ width: `${Math.max((count / stats.total_orders) * 100, 8)}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-slate-600 w-6 text-right">{count}</span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
