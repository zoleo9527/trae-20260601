import { FileText, Send, Bell, RefreshCw, Check, Clock } from 'lucide-react';
import { useScaleStore } from '../store/useScaleStore';
import { useUserStore } from '../store/useUserStore';
import { StatusBadge } from '../components/StatusBadge';
import type { ScaleStatus } from '../types';

const scaleStatusHelp: Record<string, { icon: typeof FileText; label: string; color: string; bg: string }> = {
  not_sent: { icon: FileText, label: '未发送', color: 'text-text-tertiary', bg: 'bg-surface-muted' },
  sent: { icon: Clock, label: '待填写', color: 'text-primary-600', bg: 'bg-primary-50' },
  retest_needed: { icon: RefreshCw, label: '需复测', color: 'text-status-warning', bg: 'bg-red-50' },
  done: { icon: Check, label: '已完成', color: 'text-status-normal', bg: 'bg-emerald-50' },
};

export function Scales() {
  const { currentUser } = useUserStore();
  const { scaleRecords, filterStatus, setFilterStatus, getFilteredRecords, sendScale, notifyClient, markRetestNeeded } = useScaleStore();

  const filteredRecords = getFilteredRecords();

  const statusOptions: { value: ScaleStatus | 'all'; label: string }[] = [
    { value: 'all', label: '全部状态' },
    { value: 'not_sent', label: '未发送' },
    { value: 'sent', label: '待填写' },
    { value: 'submitted', label: '已提交' },
    { value: 'retest_needed', label: '需复测' },
    { value: 'retest_submitted', label: '复测已交' },
  ];

  const stats = {
    notSent: scaleRecords.filter((s) => s.status === 'not_sent').length,
    pending: scaleRecords.filter((s) => s.status === 'sent').length,
    retest: scaleRecords.filter((s) => s.status === 'retest_needed').length,
    completed: scaleRecords.filter((s) => s.status === 'submitted' || s.status === 'retest_submitted').length,
  };

  const statItems = [
    { key: 'not_sent', value: stats.notSent },
    { key: 'sent', value: stats.pending },
    { key: 'retest_needed', value: stats.retest },
    { key: 'done', value: stats.completed },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="section-title">量表管理</h1>
        <p className="muted-text mt-0.5">量表发放、填写与复测追踪</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {statItems.map((item) => {
          const config = scaleStatusHelp[item.key];
          const Icon = config.icon;
          return (
            <div key={item.key} className="stat-card">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg ${config.bg} flex items-center justify-center`}>
                  <Icon size={18} className={config.color} />
                </div>
                <div>
                  <p className="text-xl font-semibold text-text-primary">{item.value}</p>
                  <p className="text-2xs text-text-tertiary">{config.label}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-3">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as ScaleStatus | 'all')}
          className="filter-select"
        >
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-surface-muted/50">
              <th className="text-left py-3 px-5 text-2xs font-medium text-text-tertiary">来访者</th>
              <th className="text-left py-3 px-5 text-2xs font-medium text-text-tertiary">量表</th>
              <th className="text-left py-3 px-5 text-2xs font-medium text-text-tertiary">发送</th>
              <th className="text-left py-3 px-5 text-2xs font-medium text-text-tertiary">提交</th>
              <th className="text-left py-3 px-5 text-2xs font-medium text-text-tertiary">状态</th>
              <th className="text-left py-3 px-5 text-2xs font-medium text-text-tertiary">通知</th>
              <th className="text-left py-3 px-5 text-2xs font-medium text-text-tertiary">复测</th>
              <th className="text-left py-3 px-5 text-2xs font-medium text-text-tertiary">操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredRecords.map((record) => (
              <tr key={record.id} className="table-row">
                <td className="py-3 px-5">
                  <span className="text-sm text-text-primary">{record.clientName}</span>
                </td>
                <td className="py-3 px-5 text-sm text-text-secondary">{record.scaleType}</td>
                <td className="py-3 px-5 text-2xs text-text-tertiary">{record.sentAt || '—'}</td>
                <td className="py-3 px-5 text-2xs text-text-tertiary">{record.submittedAt || '—'}</td>
                <td className="py-3 px-5">
                  <StatusBadge type="scale" status={record.status} />
                </td>
                <td className="py-3 px-5">
                  {record.clientNotified ? (
                    <span className="text-2xs text-status-normal flex items-center gap-1">
                      <Check size={12} /> 已通知
                    </span>
                  ) : (
                    <span className="text-2xs text-text-tertiary">未通知</span>
                  )}
                </td>
                <td className="py-3 px-5">
                  {record.needsRetest ? (
                    record.retestDeadline ? (
                      <span className="text-2xs text-amber-600">截止 {record.retestDeadline}</span>
                    ) : (
                      <span className="text-2xs text-amber-600">需复测</span>
                    )
                  ) : (
                    <span className="text-2xs text-text-tertiary">—</span>
                  )}
                </td>
                <td className="py-3 px-5">
                  <div className="flex items-center gap-2">
                    {record.status === 'not_sent' && currentUser.role === 'reception' && (
                      <button
                        onClick={() => sendScale(record.id)}
                        className="flex items-center gap-1 text-2xs text-primary-600 hover:text-primary-700 transition-colors"
                      >
                        <Send size={12} /> 发送
                      </button>
                    )}
                    {record.status === 'sent' && !record.clientNotified && (
                      <button
                        onClick={() => notifyClient(record.id)}
                        className="flex items-center gap-1 text-2xs text-amber-600 hover:text-amber-700 transition-colors"
                      >
                        <Bell size={12} /> 提醒
                      </button>
                    )}
                    {record.status === 'submitted' && currentUser.role === 'counselor' && (
                      <button
                        onClick={() => markRetestNeeded(record.id, '2026-06-10')}
                        className="flex items-center gap-1 text-2xs text-amber-600 hover:text-amber-700 transition-colors"
                      >
                        <RefreshCw size={12} /> 标记复测
                      </button>
                    )}
                    {record.needsRetest && record.status === 'retest_needed' && (
                      <button
                        onClick={() => notifyClient(record.id)}
                        className="flex items-center gap-1 text-2xs text-status-warning hover:text-red-600 transition-colors"
                      >
                        <Bell size={12} /> 催交
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
