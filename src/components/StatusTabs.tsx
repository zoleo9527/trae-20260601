import { useMemo } from 'react';
import { ShieldAlert, ShieldCheck, AlertTriangle, Clock, DollarSign, Users, TrendingUp, UserCheck, FileX, Gauge, AlertOctagon, Activity, FileWarning } from 'lucide-react';
import { useReminderStore } from '../store/reminder';
import type { ReminderStatus, UserRole, RiskLevel, RiskCategory } from '../../shared/types';
import { statusMap, riskLevelMap, riskCategoryMap, roleMap, getHandoverInfo } from '../utils/format';

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

  const roleFollowUpStats = useMemo(() => {
    const myRecords = allReminders.filter(
      (r) => r.currentOwnerRole === currentRole && r.status !== 'completed'
    );
    const myOverdue = myRecords.filter((r) => {
      const h = getHandoverInfo(r);
      return h.isOverdue;
    });
    const myGapRisk = myRecords.filter((r) => {
      const h = getHandoverInfo(r);
      return h.isGapRisk;
    });
    const myGapOverdue = myRecords.filter((r) => {
      const h = getHandoverInfo(r);
      return h.isGapRisk && h.isOverdue;
    });

    let pendingCount = 0;
    let actionLabel = '';

    switch (currentRole) {
      case 'enroller':
        pendingCount = allReminders.filter((r) => r.status === 'pending_schedule' || r.status === 'pending_confirm').length;
        actionLabel = '待安排/确认';
        break;
      case 'coach':
        pendingCount = allReminders.filter((r) => r.status === 'pending_execute').length;
        actionLabel = '待执行';
        break;
      case 'safety_officer':
        pendingCount = allReminders.filter((r) => r.status === 'disputed').length;
        actionLabel = '待处理争议';
        break;
    }

    return {
      myTotal: myRecords.length,
      myOverdue: myOverdue.length,
      myGapRisk: myGapRisk.length,
      myGapOverdue: myGapOverdue.length,
      pendingCount,
      actionLabel,
    };
  }, [allReminders, currentRole]);

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

  const highRiskStats = useMemo(() => {
    const highRiskList = allReminders.filter((r) => r.riskLevel === 'high' || r.riskLevel === 'critical');
    const byCategory: Record<string, { count: number; records: typeof allReminders }> = {};
    const byRole: Record<string, { count: number; records: typeof allReminders }> = {};
    let totalActiveRisks = 0;
    let criticalCount = 0;
    let highCount = 0;
    let gapRiskCount = 0;
    let gapOverdueCount = 0;
    let pendingConfirmGap = 0;
    let disputedGap = 0;

    highRiskList.forEach((r) => {
      const activeRisks = r.risks.filter((x) => !x.resolved);
      totalActiveRisks += activeRisks.length;
      if (r.riskLevel === 'critical') criticalCount++;
      if (r.riskLevel === 'high') highCount++;

      const handover = getHandoverInfo(r);
      if (handover.isGapRisk) {
        gapRiskCount++;
        if (handover.isOverdue) gapOverdueCount++;
        if (r.status === 'pending_confirm') pendingConfirmGap++;
        if (r.status === 'disputed') disputedGap++;
      }

      activeRisks.forEach((risk) => {
        if (!byCategory[risk.category]) {
          byCategory[risk.category] = { count: 0, records: [] };
        }
        byCategory[risk.category].count++;
        if (!byCategory[risk.category].records.find((x) => x.id === r.id)) {
          byCategory[risk.category].records.push(r);
        }
      });

      if (!byRole[r.currentOwnerRole]) {
        byRole[r.currentOwnerRole] = { count: 0, records: [] };
      }
      byRole[r.currentOwnerRole].count++;
      if (!byRole[r.currentOwnerRole].records.find((x) => x.id === r.id)) {
        byRole[r.currentOwnerRole].records.push(r);
      }
    });

    const categoryOrder: RiskCategory[] = [
      'fee_discrepancy', 'schedule_delay', 'missing_record', 'safety_concern',
      'coach_overload', 'student_complaint', 'process_irregularity', 'other'
    ];

    const categoryStats = categoryOrder
      .filter((c) => byCategory[c])
      .map((c) => ({
        category: c,
        ...byCategory[c],
      }));

    const roleStats = (['enroller', 'coach', 'safety_officer'] as UserRole[])
      .filter((r) => byRole[r])
      .map((r) => ({
        role: r,
        ...byRole[r],
      }));

    const oldestRisk = highRiskList
      .flatMap((r) => r.risks.filter((x) => !x.resolved))
      .sort((a, b) => (a.markedAt > b.markedAt ? 1 : -1))[0];

    return {
      totalRecords: highRiskList.length,
      totalActiveRisks,
      criticalCount,
      highCount,
      gapRiskCount,
      gapOverdueCount,
      pendingConfirmGap,
      disputedGap,
      categoryStats,
      roleStats,
      oldestRisk,
    };
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
            <div className="flex items-center gap-3 flex-shrink-0 text-xs">
              <div className="flex items-center gap-1">
                <UserCheck size={12} className="text-navy-600" />
                <span className="text-slate-500">{roleFollowUpStats.actionLabel}：</span>
                <span className="font-semibold text-navy-700">{roleFollowUpStats.pendingCount}</span>
              </div>
              {roleFollowUpStats.myGapRisk > 0 && (
                <div className="flex items-center gap-1">
                  <FileWarning size={12} className="text-orange-600" />
                  <span className="text-slate-500">空档风险：</span>
                  <span className="font-semibold text-orange-700">{roleFollowUpStats.myGapRisk}</span>
                </div>
              )}
              {roleFollowUpStats.myGapOverdue > 0 && (
                <div className="flex items-center gap-1 bg-red-100 text-red-700 px-1.5 py-0.5 rounded-sm border border-red-200">
                  <AlertOctagon size={10} />
                  <span className="font-medium">逾期 {roleFollowUpStats.myGapOverdue}</span>
                </div>
              )}
              {totalHighRisk > 0 && (
                <div className="flex items-center gap-1 pl-2 ml-1 border-l border-amber-200">
                  <span className="text-slate-500">高风险：</span>
                  <span className="font-semibold text-red-600">{totalHighRisk} 条</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {filterStatus === 'risk_high' && highRiskStats.totalRecords > 0 && (
        <div className="px-6 py-3 bg-gradient-to-r from-red-50/80 to-orange-50/50 border-b border-red-100">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <AlertOctagon size={16} className="text-red-600" />
              <span className="text-sm font-semibold text-red-800">高风险预警面板</span>
            </div>
            <div className="flex items-center gap-4 flex-1">
              <div className="flex items-center gap-1.5 text-xs">
                <Gauge size={12} className="text-red-600" />
                <span className="text-slate-600">涉及记录：</span>
                <span className="font-semibold text-red-700">{highRiskStats.totalRecords} 条</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <AlertTriangle size={12} className="text-red-600" />
                <span className="text-slate-600">风险项数：</span>
                <span className="font-semibold text-red-700">{highRiskStats.totalActiveRisks} 项</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <TrendingUp size={12} className="text-rose-600" />
                <span className="text-slate-600">严重：</span>
                <span className="font-semibold text-rose-700">{highRiskStats.criticalCount} 条</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <TrendingUp size={12} className="text-orange-600" />
                <span className="text-slate-600">高风险：</span>
                <span className="font-semibold text-orange-700">{highRiskStats.highCount} 条</span>
              </div>
            </div>
            {highRiskStats.gapRiskCount > 0 && (
              <div className="flex items-center gap-3 ml-4 pl-4 border-l border-red-200">
                <div className="flex items-center gap-1.5 text-xs">
                  <FileWarning size={12} className="text-red-600" />
                  <span className="text-slate-600">空档风险：</span>
                  <span className="font-semibold text-red-700">{highRiskStats.gapRiskCount} 条</span>
                </div>
                {highRiskStats.gapOverdueCount > 0 && (
                  <div className="flex items-center gap-1 text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded-sm border border-red-200 animate-pulse">
                    <AlertOctagon size={10} />
                    <span className="font-medium">逾期 {highRiskStats.gapOverdueCount} 条</span>
                  </div>
                )}
                {highRiskStats.pendingConfirmGap > 0 && (
                  <div className="flex items-center gap-1 text-xs">
                    <span className="text-slate-500">待费用确认：</span>
                    <span className="font-medium text-amber-700">{highRiskStats.pendingConfirmGap}</span>
                  </div>
                )}
                {highRiskStats.disputedGap > 0 && (
                  <div className="flex items-center gap-1 text-xs">
                    <span className="text-slate-500">待安全员介入：</span>
                    <span className="font-medium text-red-700">{highRiskStats.disputedGap}</span>
                  </div>
                )}
              </div>
            )}
            {highRiskStats.oldestRisk && (
              <div className="flex-shrink-0 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-sm px-2 py-1 flex items-center gap-1">
                <span className="text-slate-500">最久未处理：</span>
                <span className="font-medium">{highRiskStats.oldestRisk.markedByName}</span>
                <span className={`px-1 py-0.5 rounded-sm text-white ${roleMap[highRiskStats.oldestRisk.markedByRole]?.className || 'bg-slate-400'}`}>
                  {roleMap[highRiskStats.oldestRisk.markedByRole]?.label}
                </span>
                <span className="text-slate-400">·</span>
                <span className="font-mono">{highRiskStats.oldestRisk.markedAt.slice(5, 16)}</span>
              </div>
            )}
          </div>
          {highRiskStats.categoryStats.length > 0 && (
            <div className="flex items-center gap-3 mt-2 pt-2 border-t border-red-100/50">
              <div className="text-xs text-slate-500 flex items-center gap-1">
                <Activity size={12} />
                风险类别：
              </div>
              {highRiskStats.categoryStats.map((stat) => (
                <div key={stat.category} className="flex items-center gap-1 text-xs bg-white/80 border border-slate-200 rounded-sm px-2 py-0.5">
                  <span className="text-slate-700">{riskCategoryMap[stat.category]?.label}</span>
                  <span className="font-semibold text-red-600">{stat.count}项</span>
                </div>
              ))}
            </div>
          )}
          {highRiskStats.roleStats.length > 0 && (
            <div className="flex items-center gap-3 mt-2">
              <div className="text-xs text-slate-500 flex items-center gap-1">
                <UserCheck size={12} />
                责任分布：
              </div>
              {highRiskStats.roleStats.map((stat) => (
                <div key={stat.role} className="flex items-center gap-1 text-xs bg-white/80 border border-slate-200 rounded-sm px-2 py-0.5">
                  <span className={`px-1 py-0.5 rounded-sm text-white ${roleMap[stat.role].className}`}>
                    {roleMap[stat.role].label}
                  </span>
                  <span className="font-semibold text-slate-700">{stat.count}条</span>
                  <span className="text-slate-400">·</span>
                  <span className="text-slate-500">
                    {stat.records.map((r) => r.currentOwnerName).filter((n, i, arr) => arr.indexOf(n) === i).join('、')}
                  </span>
                </div>
              ))}
            </div>
          )}
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
