import { useMemo } from 'react';
import { ShieldAlert, ShieldCheck, AlertTriangle, Clock, DollarSign, Users } from 'lucide-react';
import { useReminderStore } from '../store/reminder';
import type { ReminderStatus, UserRole, RiskLevel } from '../../shared/types';
import { statusMap, riskLevelMap } from '../utils/format';

interface Tab {
  value: string;
  label: string;
  count: number;
}

const roleRiskTips: Record<UserRole, { icon: any; level: RiskLevel; title: string; desc: string; category: string }[]> = {
  enroller: [
    {
      icon: Clock,
      level: 'medium',
      title: '费用确认时效',
      desc: '补训完成后请在 3 个工作日内完成费用确认',
      category: 'schedule_delay',
    },
    {
      icon: DollarSign,
      level: 'high',
      title: '费用争议风险',
      desc: '学员对费用有异议时，请及时标记并跟进处理',
      category: 'fee_discrepancy',
    },
  ],
  coach: [
    {
      icon: Users,
      level: 'medium',
      title: '带教负荷',
      desc: '单日带教学员请勿超过 5 人，确保培训质量',
      category: 'coach_overload',
    },
    {
      icon: ShieldAlert,
      level: 'high',
      title: '安全操作规范',
      desc: '训练中发现安全隐患请及时记录并整改',
      category: 'safety_concern',
    },
  ],
  safety_officer: [
    {
      icon: AlertTriangle,
      level: 'critical',
      title: '严重风险追踪',
      desc: '严重风险记录需在 24 小时内介入处理',
      category: 'other',
    },
    {
      icon: ShieldCheck,
      level: 'medium',
      title: '流程合规检查',
      desc: '定期抽查补训记录，确保流程规范责任清晰',
      category: 'process_irregularity',
    },
  ],
};

export default function StatusTabs() {
  const { allReminders, filterStatus, setFilterStatus, currentUserId, currentRole } = useReminderStore();

  const tabs: Tab[] = useMemo(() => {
    const base = [
      { value: 'all', label: '全部' },
      { value: 'pending_schedule' as ReminderStatus, label: statusMap['pending_schedule'].label },
      { value: 'pending_execute' as ReminderStatus, label: statusMap['pending_execute'].label },
      { value: 'pending_confirm' as ReminderStatus, label: statusMap['pending_confirm'].label },
      { value: 'completed' as ReminderStatus, label: statusMap['completed'].label },
      { value: 'disputed' as ReminderStatus, label: statusMap['disputed'].label },
      { value: 'risk_high', label: '高风险' },
    ];
    return base.map((t) => ({
      ...t,
      count:
        t.value === 'all'
          ? allReminders.length
          : t.value === 'risk_high'
            ? allReminders.filter((r) => r.riskLevel === 'high' || r.riskLevel === 'critical').length
            : allReminders.filter((r) => r.status === t.value).length,
    }));
  }, [allReminders]);

  const myCount = useMemo(() => {
    return allReminders.filter(
      (r) => r.currentOwnerId === currentUserId && r.status !== 'completed'
    ).length;
  }, [allReminders, currentUserId]);

  const myRiskCount = useMemo(() => {
    return allReminders.filter(
      (r) =>
        r.currentOwnerId === currentUserId &&
        r.status !== 'completed' &&
        (r.riskLevel === 'high' || r.riskLevel === 'critical')
    ).length;
  }, [allReminders, currentUserId]);

  const totalHighRisk = useMemo(() => {
    return allReminders.filter((r) => r.riskLevel === 'high' || r.riskLevel === 'critical').length;
  }, [allReminders]);

  const tips = roleRiskTips[currentRole] || [];

  return (
    <div className="bg-white border-b border-slate-200">
      {tips.length > 0 && (
        <div className="px-6 py-2.5 bg-gradient-to-r from-amber-50 to-transparent border-b border-amber-100">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-xs text-amber-700 font-medium">
              <ShieldAlert size={14} />
              {currentRole === 'safety_officer' ? '安全官风险提示' : '责任风险提示'}
            </div>
            <div className="flex items-center gap-4 flex-1 min-w-0">
              {tips.map((tip, idx) => {
                const Icon = tip.icon;
                return (
                  <div key={idx} className="flex items-center gap-1.5 text-xs text-slate-600">
                    <Icon size={12} className={riskLevelMap[tip.level].className} />
                    <span className="font-medium text-slate-700">{tip.title}：</span>
                    <span className="truncate">{tip.desc}</span>
                  </div>
                );
              })}
            </div>
            {totalHighRisk > 0 && (
              <div className="flex-shrink-0 text-xs">
                <span className="text-slate-500">待处理风险：</span>
                <span className="font-semibold text-red-600">{totalHighRisk} 条</span>
              </div>
            )}
          </div>
        </div>
      )}
      <div className="px-6">
        <div className="flex items-center gap-1">
        {myCount > 0 && (
          <button
            onClick={() => setFilterStatus('mine')}
            className={`relative px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              filterStatus === 'mine'
                ? 'border-accent text-accent-dark'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            我的待办
            <span className={`ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5 rounded-full text-xs font-semibold ${
              filterStatus === 'mine' ? 'bg-accent text-white' : 'bg-accent/15 text-accent-dark'
            }`}>
              {myCount}
            </span>
          </button>
        )}
        {tabs.map((tab) => {
          const active = filterStatus === tab.value;
          const isRiskTab = tab.value === 'risk_high';
          return (
            <button
              key={tab.value}
              onClick={() => setFilterStatus(tab.value)}
              className={`relative px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                active
                  ? isRiskTab
                    ? 'border-red-500 text-red-600'
                    : 'border-navy-700 text-navy-800'
                  : isRiskTab
                    ? 'border-transparent text-red-500 hover:text-red-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span
                  className={`ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5 rounded-full text-xs font-semibold ${
                    active
                      ? isRiskTab
                        ? 'bg-red-500 text-white'
                        : 'bg-navy-700 text-white'
                      : isRiskTab
                        ? 'bg-red-100 text-red-600'
                        : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
        </div>
      </div>
    </div>
  );
}
