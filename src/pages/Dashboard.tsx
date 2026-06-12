import { useNavigate } from 'react-router-dom';
import {
  FilePlus,
  ClipboardList,
  Receipt,
  Users,
  CheckCircle2,
  ChevronRight,
  Building2,
  Phone,
  ArrowUpRight,
} from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { StatusBadge } from '@/components/common/StatusBadge';
import { formatCurrency, formatDate } from '@/utils/formatters';
import type { ApplicationStatus } from '@/types';
import { STATUS_LABELS } from '@/types';

const STATS: { key: ApplicationStatus | 'all'; label: string; icon: any; color: string; numberColor: string }[] = [
  { key: 'all', label: '全部申请', icon: FilePlus, color: 'from-navy-600 to-navy-800', numberColor: 'text-amber-300' },
  { key: 'inspecting', label: '待验收/验收中', icon: ClipboardList, color: 'from-navy-500 to-navy-700', numberColor: 'text-amber-200' },
  { key: 'costing', label: '费用核算中', icon: Receipt, color: 'from-sage-500 to-sage-700', numberColor: 'text-white' },
  { key: 'confirming', label: '待客户确认', icon: Users, color: 'from-coral-400 to-coral-600', numberColor: 'text-white' },
  { key: 'disputing', label: '异议处理中', icon: Users, color: 'from-coral-500 to-coral-700', numberColor: 'text-white' },
  { key: 'completed', label: '已完成', icon: CheckCircle2, color: 'from-sage-600 to-sage-800', numberColor: 'text-white' },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const applications = useAppStore((s) => s.applications);
  const currentRole = useAppStore((s) => s.currentRole);

  const counts = STATS.reduce<Record<string, number>>((acc, s) => {
    if (s.key === 'all') acc[s.key] = applications.length;
    else acc[s.key] = applications.filter((a) => a.status === s.key).length;
    return acc;
  }, {});

  const totalDepositAmount = applications.reduce((sum, a) => sum + a.contract.depositAmount, 0);
  const totalRefundPending = applications
    .filter((a) => ['confirming', 'disputing'].includes(a.status))
    .reduce((sum, a) => sum + (a.costBreakdown?.refundAmount || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in opacity-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-navy-900">退租清算工作台</h1>
          <p className="text-sm text-navy-500 mt-1">
            当前以 <span className="text-navy-700 font-medium">
              {{
                consultant: '租赁顾问',
                manager: '运营经理',
                finance: '财务人员',
                customer: '企业客户',
              }[currentRole]}
            </span> 身份查看 · {formatDate(new Date().toISOString())}
          </p>
        </div>
        <button onClick={() => navigate('/application/new')} className="btn-amber">
          <FilePlus className="w-4 h-4" strokeWidth={2} />
          新建退租申请
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {STATS.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.key}
              className={`relative p-5 rounded-lg bg-gradient-to-br ${stat.color} text-white shadow-card overflow-hidden animate-fade-in-up opacity-0 stagger-${idx + 1} group hover:shadow-card-hover transition-all duration-300 hover:-translate-y-0.5 cursor-pointer`}
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -translate-y-8 translate-x-8 group-hover:scale-110 transition-transform duration-500"></div>
              <div className="relative">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center backdrop-blur">
                    <Icon className="w-4.5 h-4.5" strokeWidth={2} />
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white/70 group-hover:translate-x-0.5 transition-all" />
                </div>
                <p className={`font-serif text-3xl font-semibold ${stat.numberColor} mb-1 animate-number-roll opacity-0`}>
                  {counts[stat.key] || 0}
                </p>
                <p className="text-xs text-white/70">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-6 animate-fade-in-up opacity-0 stagger-1">
          <div className="flex items-center justify-between mb-5">
            <h2 className="section-title mb-0">
              <ClipboardList className="w-5 h-5 text-navy-600" strokeWidth={2} />
              退租申请列表
            </h2>
            <div className="flex gap-1.5">
              {(['all', 'pending', 'inspecting', 'costing', 'confirming', 'disputing', 'completed'] as const).map((status) => (
                <span
                  key={status}
                  className="px-2 py-1 text-xs rounded bg-navy-50 text-navy-500"
                >
                  {status === 'all' ? '全部' : STATUS_LABELS[status]}
                </span>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-navy-100">
                  <th className="text-left py-3 px-3 font-medium text-navy-500 text-xs uppercase tracking-wider">租户信息</th>
                  <th className="text-left py-3 px-3 font-medium text-navy-500 text-xs uppercase tracking-wider">租赁位置</th>
                  <th className="text-left py-3 px-3 font-medium text-navy-500 text-xs uppercase tracking-wider">押金金额</th>
                  <th className="text-left py-3 px-3 font-medium text-navy-500 text-xs uppercase tracking-wider">申请时间</th>
                  <th className="text-left py-3 px-3 font-medium text-navy-500 text-xs uppercase tracking-wider">状态</th>
                  <th className="text-right py-3 px-3 font-medium text-navy-500 text-xs uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app, idx) => (
                  <tr
                    key={app.id}
                    onClick={() => navigate(`/application/${app.id}`)}
                    className="border-b border-navy-50 hover:bg-navy-50/60 cursor-pointer transition-colors animate-fade-in-up opacity-0"
                    style={{ animationDelay: `${100 + idx * 50}ms` }}
                  >
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-navy-100 to-navy-200 flex items-center justify-center text-navy-700 font-medium text-sm shrink-0">
                          {app.tenant.companyName.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-navy-800 truncate">{app.tenant.companyName}</p>
                          <p className="text-xs text-navy-500 flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3" />
                            {app.tenant.contactPerson} · {app.tenant.contactPhone}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-1.5 text-navy-600">
                        <Building2 className="w-3.5 h-3.5 text-navy-400" />
                        {app.contract.floorRoom}
                      </div>
                      <p className="text-xs text-navy-400 mt-0.5">{app.contract.contractNo}</p>
                    </td>
                    <td className="py-3.5 px-3">
                      <p className="money-text text-navy-800">{formatCurrency(app.contract.depositAmount)}</p>
                      <p className="text-xs text-navy-400 mt-0.5">{app.contract.area} ㎡</p>
                    </td>
                    <td className="py-3.5 px-3 text-navy-600">
                      {formatDate(app.createdAt)}
                    </td>
                    <td className="py-3.5 px-3">
                      <StatusBadge status={app.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <span className="inline-flex items-center gap-1 text-navy-600 text-xs font-medium hover:text-navy-800">
                        查看详情
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6 animate-fade-in-up opacity-0 stagger-2">
            <h2 className="section-title text-base mb-4">
              <Receipt className="w-5 h-5 text-navy-600" strokeWidth={2} />
              押金概况
            </h2>
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-gradient-to-br from-navy-700 to-navy-900 text-white">
                <p className="text-xs text-navy-300 mb-1">押金总金额</p>
                <p className="font-serif text-2xl font-semibold text-amber-300 money-text animate-number-roll opacity-0 stagger-1">
                  {formatCurrency(totalDepositAmount)}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-sage-50 border border-sage-200">
                <p className="text-xs text-sage-600 mb-1">待退还押金</p>
                <p className="font-serif text-xl font-semibold text-sage-700 money-text animate-number-roll opacity-0 stagger-2">
                  {formatCurrency(totalRefundPending)}
                </p>
              </div>
            </div>
          </div>

          <div className="card p-6 animate-fade-in-up opacity-0 stagger-3">
            <h2 className="section-title text-base mb-4">
              <ClipboardList className="w-5 h-5 text-navy-600" strokeWidth={2} />
              待办事项
            </h2>
            <div className="space-y-3">
              {applications
                .filter((a) => a.status !== 'completed')
                .slice(0, 3)
                .map((app, idx) => (
                  <div
                    key={app.id}
                    onClick={() => navigate(`/application/${app.id}`)}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-navy-50 cursor-pointer transition-colors group"
                  >
                    <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${
                      idx === 0 ? 'bg-coral-500 animate-pulse' : 'bg-amber-400'
                    }`}></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-navy-800 truncate group-hover:text-navy-600">
                        {app.tenant.companyName}
                      </p>
                      <p className="text-xs text-navy-500 mt-0.5">
                        {STATUS_LABELS[app.status]} · {app.surrenderInfo.reason}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-navy-300 group-hover:text-navy-500 group-hover:translate-x-0.5 transition-all mt-1 shrink-0" />
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
