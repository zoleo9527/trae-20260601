import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, X, ChevronRight, AlertTriangle, Clock, ShieldAlert } from 'lucide-react';
import { useStore, timeAgo, getEmployeeActiveRisks, getEmployeeLogs } from '@/store';
import { ROLE_LABEL, STATUS_LABEL } from '@/constants';
import type { EmployeeStatus, RiskFlagType, UserRole } from '@/types';
import AnimatedNumber from '@/components/AnimatedNumber';
import StatusBadge from '@/components/StatusBadge';
import RiskBadge from '@/components/RiskBadge';
import RoleAvatar from '@/components/RoleAvatar';
import { cn } from '@/lib/utils';

const statConfig = [
  { key: 'pending_training', label: '待入场培训', color: 'from-brand-50 to-brand-100 border-brand-200', textColor: 'text-brand-700' },
  { key: 'in_training', label: '培训中', color: 'from-amber/5 to-amber/10 border-amber/30', textColor: 'text-amber' },
  { key: 'training_exception', label: '培训异常', color: 'from-rose/5 to-rose/10 border-rose/30', textColor: 'text-rose' },
  { key: 'pending_documents', label: '待收证件', color: 'from-brand-50 to-brand-100 border-brand-200', textColor: 'text-brand-600' },
  { key: 'collecting_documents', label: '证件收集中', color: 'from-amber/5 to-amber/10 border-amber/30', textColor: 'text-amber' },
  { key: 'completed', label: '已完成', color: 'from-emerald/5 to-emerald/10 border-emerald/30', textColor: 'text-emerald' },
] as const;

const statusOptions: { value: EmployeeStatus | ''; label: string }[] = [
  { value: '', label: '全部状态' },
  { value: 'pending_training', label: '待入场培训' },
  { value: 'in_training', label: '培训中' },
  { value: 'training_exception', label: '培训异常' },
  { value: 'pending_documents', label: '待证件收集' },
  { value: 'collecting_documents', label: '证件收集中' },
  { value: 'completed', label: '已完成' },
];

const riskOptions: { value: RiskFlagType | ''; label: string }[] = [
  { value: '', label: '全部风险' },
  { value: 'temporary_absence', label: '临时缺岗' },
  { value: 'attendance_dispute', label: '考勤争议' },
  { value: 'salary_deduction', label: '工资扣款' },
];

const ownerOptions: { value: UserRole | ''; label: string }[] = [
  { value: '', label: '全部责任人' },
  { value: 'recruiter', label: '招聘专员' },
  { value: 'site_supervisor', label: '驻场主管' },
  { value: 'payroll_accountant', label: '薪酬会计' },
];

export default function Dashboard() {
  const { employees, riskFlags, filters, setFilters, clearFilters, currentUser } = useStore();
  const [showFilters, setShowFilters] = useState(false);

  const stats = useMemo(() => {
    const counts: Record<string, number> = {
      pending_training: 0,
      in_training: 0,
      training_exception: 0,
      pending_documents: 0,
      collecting_documents: 0,
      completed: 0,
    };
    employees.forEach((e) => {
      counts[e.currentStatus]++;
    });
    return counts;
  }, [employees]);

  const activeRiskCount = useMemo(() => riskFlags.filter((f) => f.active).length, [riskFlags]);

  const gapEmployees = useMemo(() => {
    return employees.filter((e) => e.currentStatus === 'pending_documents').sort(
      (a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
    );
  }, [employees]);

  const filteredEmployees = useMemo(() => {
    let result = [...employees];
    if (filters.status) {
      result = result.filter((e) => e.currentStatus === filters.status);
    }
    if (filters.riskType) {
      const empWithRisk = riskFlags
        .filter((f) => f.active && f.flagType === filters.riskType)
        .map((f) => f.employeeId);
      result = result.filter((e) => empWithRisk.includes(e.id));
    }
    if (filters.owner) {
      result = result.filter((e) => e.currentOwner === filters.owner);
    }
    if (filters.keyword) {
      const kw = filters.keyword.toLowerCase();
      result = result.filter(
        (e) =>
          e.name.toLowerCase().includes(kw) ||
          e.dispatchCompany.toLowerCase().includes(kw) ||
          e.position.toLowerCase().includes(kw)
      );
    }
    return result.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }, [employees, filters, riskFlags]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-semibold text-ink-900">员工总览</h1>
          <p className="text-sm text-ink-500 mt-1">
            当前视角：<span className="font-medium text-ink-700">{ROLE_LABEL[currentUser.role]}</span>
          </p>
        </div>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter size={16} />
          筛选
          {(filters.status || filters.riskType || filters.owner || filters.keyword) && (
            <span className="w-5 h-5 rounded-full bg-brand-600 text-white text-[10px] flex items-center justify-center">
              {[filters.status, filters.riskType, filters.owner, filters.keyword].filter(Boolean).length}
            </span>
          )}
        </button>
      </div>

      {showFilters && (
        <div className="card p-4 animate-slide-up">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="label">搜索</label>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
                <input
                  type="text"
                  className="field pl-9"
                  placeholder="姓名、派遣单位、岗位"
                  value={filters.keyword || ''}
                  onChange={(e) => setFilters({ keyword: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="label">状态</label>
              <select
                className="field"
                value={filters.status || ''}
                onChange={(e) => setFilters({ status: (e.target.value as EmployeeStatus) || undefined })}
              >
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">风险类型</label>
              <select
                className="field"
                value={filters.riskType || ''}
                onChange={(e) => setFilters({ riskType: (e.target.value as RiskFlagType) || undefined })}
              >
                {riskOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">责任人</label>
              <select
                className="field"
                value={filters.owner || ''}
                onChange={(e) => setFilters({ owner: (e.target.value as UserRole) || undefined })}
              >
                {ownerOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
          {(filters.status || filters.riskType || filters.owner || filters.keyword) && (
            <div className="mt-4 pt-4 border-t border-ink-100 flex justify-end">
              <button className="btn btn-ghost btn-sm" onClick={clearFilters}>
                <X size={14} /> 清除筛选
              </button>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {statConfig.map((stat, idx) => (
          <div
            key={stat.key}
            className={cn(
              'card p-4 bg-gradient-to-br',
              stat.color,
              'animate-count-up'
            )}
            style={{ animationDelay: `${idx * 60}ms` }}
          >
            <div className={cn('text-2xl font-serif font-semibold tabular-nums', stat.textColor)}>
              <AnimatedNumber value={stats[stat.key] as number} />
            </div>
            <div className="text-xs text-ink-500 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-ink-100 flex items-center justify-between">
          <h2 className="font-serif font-semibold text-ink-800">员工列表</h2>
          <span className="text-xs text-ink-500">
            共 {filteredEmployees.length} 条记录
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-ink-50">
              <tr className="text-left text-xs text-ink-500">
                <th className="px-5 py-3 font-medium">员工信息</th>
                <th className="px-5 py-3 font-medium">派遣单位 / 岗位</th>
                <th className="px-5 py-3 font-medium">状态</th>
                <th className="px-5 py-3 font-medium">风险标记</th>
                <th className="px-5 py-3 font-medium">责任人</th>
                <th className="px-5 py-3 font-medium">最近更新</th>
                <th className="px-5 py-3 font-medium w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {filteredEmployees.map((emp) => {
                const risks = getEmployeeActiveRisks(emp.id);
                return (
                  <tr
                    key={emp.id}
                    className="hover:bg-ink-50/50 transition-colors group"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-serif font-medium text-sm">
                          {emp.name.slice(0, 1)}
                        </div>
                        <div>
                          <div className="font-medium text-ink-800">{emp.name}</div>
                          <div className="text-xs text-ink-500 font-mono">
                            {emp.phone || emp.idCardNumber.replace(/^(.{6})(.+)(.{4})$/, '$1********$3')}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-sm text-ink-700">{emp.dispatchCompany}</div>
                      <div className="text-xs text-ink-500">{emp.position}</div>
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={emp.currentStatus} />
                    </td>
                    <td className="px-5 py-4">
                      {risks.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {risks.map((r) => (
                            <RiskBadge key={r.id} type={r.flagType} pulse={false} />
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-ink-300">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <RoleAvatar role={emp.currentOwner} size="sm" />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-xs text-ink-500">
                        <Clock size={12} />
                        {timeAgo(emp.updatedAt)}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <Link
                        to={
                          emp.currentStatus === 'pending_training' || emp.currentStatus === 'in_training' || emp.currentStatus === 'training_exception'
                            ? `/training/${emp.id}`
                            : `/documents/${emp.id}`
                        }
                        className="p-1.5 rounded hover:bg-brand-50 text-ink-400 hover:text-brand-600 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <ChevronRight size={16} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {filteredEmployees.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center">
                    <div className="text-ink-400 text-sm">没有匹配的员工记录</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5 border-l-4 border-l-amber">
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="text-amber mt-0.5" />
            <div className="flex-1">
              <div className="font-medium text-ink-800 text-sm">风险预警提醒</div>
              <div className="text-xs text-ink-500 mt-1">
                当前有 {activeRiskCount} 个活跃风险标记需要处理。
                {riskFlags.filter((f) => f.active && f.flagType === 'salary_deduction').length > 0 && (
                  <span className="text-rose ml-1">
                    含 {riskFlags.filter((f) => f.active && f.flagType === 'salary_deduction').length} 项工资扣款标记
                  </span>
                )}
                {riskFlags.filter((f) => f.active && f.flagType === 'temporary_absence').length > 0 && (
                  <span className="text-amber ml-1">
                    含 {riskFlags.filter((f) => f.active && f.flagType === 'temporary_absence').length} 项临时缺岗
                  </span>
                )}
                {riskFlags.filter((f) => f.active && f.flagType === 'attendance_dispute').length > 0 && (
                  <span className="text-amber ml-1">
                    含 {riskFlags.filter((f) => f.active && f.flagType === 'attendance_dispute').length} 项考勤争议
                  </span>
                )}
              </div>
              {activeRiskCount > 0 && (
                <div className="mt-3 space-y-1.5">
                  {riskFlags.filter((f) => f.active).slice(0, 3).map((flag) => {
                    const emp = employees.find((e) => e.id === flag.employeeId);
                    return (
                      <div key={flag.id} className="flex items-center gap-2 text-xs">
                        <RiskBadge type={flag.flagType} pulse={false} showIcon={false} />
                        <span className="text-ink-700 font-medium">{emp?.name}</span>
                        <span className="text-ink-400 line-clamp-1">{flag.description}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className={cn('card p-5', gapEmployees.length > 0 ? 'border-l-4 border-l-rose' : 'border-l-4 border-l-emerald')}>
          <div className="flex items-start gap-3">
            <ShieldAlert size={20} className={gapEmployees.length > 0 ? 'text-rose mt-0.5' : 'text-emerald mt-0.5'} />
            <div className="flex-1">
              <div className="font-medium text-ink-800 text-sm">责任空档检测</div>
              {gapEmployees.length > 0 ? (
                <>
                  <div className="text-xs text-rose mt-1">
                    有 {gapEmployees.length} 名员工培训已完成但证件收集尚未开始，存在流程空档
                  </div>
                  <div className="mt-3 space-y-1.5">
                    {gapEmployees.slice(0, 4).map((emp) => {
                      const logs = getEmployeeLogs(emp.id);
                      const lastLog = logs[0];
                      return (
                        <div key={emp.id} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <StatusBadge status={emp.currentStatus} size="sm" />
                            <span className="text-ink-700 font-medium">{emp.name}</span>
                            <span className="text-ink-400">{emp.dispatchCompany}</span>
                          </div>
                          <Link
                            to={`/documents/${emp.id}`}
                            className="text-brand-600 hover:underline"
                          >
                            前往收集
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="text-xs text-emerald mt-1">
                  所有员工流程衔接正常，无责任空档
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
